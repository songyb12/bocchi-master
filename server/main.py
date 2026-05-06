"""
Bocchi-master API Server

- Chord Search: Claude CLI-based chord progression lookup
- Tab Parser: Guitar Pro file → BocchiMaster Track JSON

Stem separation + YouTube ingest are delegated to 15_AudioChord (port 8220).

Run: uvicorn main:app --app-dir server --host 0.0.0.0 --port 8081
"""

import json
import logging
import os
import shutil
import subprocess
import tempfile
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from tab_parser import parse_gp_file

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bocchi.chord_search")

app = FastAPI(title="Bocchi-master API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Claude CLI discovery ──

def _find_claude_cli() -> str | None:
    """Find claude CLI binary. Checks env var, PATH, then known install locations."""
    env = os.environ.get("CLAUDE_CLI_PATH")
    if env and Path(env).is_file():
        return env

    found = shutil.which("claude")
    if found:
        return found

    # Windows: Roaming/Claude/claude-code/*/claude.exe
    roaming = Path.home() / "AppData" / "Roaming" / "Claude" / "claude-code"
    if roaming.is_dir():
        versions = sorted(roaming.iterdir(), reverse=True)
        for v in versions:
            exe = v / "claude.exe"
            if exe.is_file():
                return str(exe)

    return None


CLAUDE_CLI = _find_claude_cli()
logger.info("Claude CLI: %s", CLAUDE_CLI or "NOT FOUND")


# ── Rate limit ──

_call_count = 0
_call_date = date.today().isoformat()
DAILY_LIMIT = 100


def _check_rate_limit() -> None:
    global _call_count, _call_date
    today = date.today().isoformat()
    if today != _call_date:
        _call_count = 0
        _call_date = today
    if _call_count >= DAILY_LIMIT:
        raise HTTPException(status_code=429, detail="Daily LLM call limit reached")
    _call_count += 1


# ── Schemas ──

class ChordSearchRequest(BaseModel):
    title: str
    artist: str | None = None


class SongChordEntry(BaseModel):
    chord: str
    beats: int
    annotation: str | None = None


class SongSectionEntry(BaseModel):
    name: str
    chords: list[SongChordEntry]


class ChordSearchResponse(BaseModel):
    id: str
    title: str
    artist: str | None = None
    genre: str | None = None
    key: str | None = None
    bpm: int | None = None
    timeSignature: list[int] | None = None
    sections: list[SongSectionEntry]
    source: str = "llm"
    createdAt: str
    updatedAt: str


PROMPT_TEMPLATE = """Return the chord progression for the song "{title}"{artist_hint}.
Provide the actual, accurate chord progression as widely known.
Include at least Verse and Chorus sections.
Use standard chord notation (e.g. Am, F#m7, Bbmaj7).
Set beats to the number of beats each chord is held.

Reply with ONLY a JSON object in this exact format, no other text:
{{
  "title": "Song Title",
  "artist": "Artist Name",
  "genre": "Genre",
  "key": "C",
  "bpm": 120,
  "timeSignature": [4, 4],
  "sections": [
    {{
      "name": "Verse",
      "chords": [
        {{"chord": "Am", "beats": 4}},
        {{"chord": "F", "beats": 4}}
      ]
    }}
  ]
}}

Section names must be one of: Intro, Verse, Pre-Chorus, Chorus, Bridge, Interlude, Solo, Outro, Other."""


# ── Endpoints ──

@app.get("/")
async def root():
    return {"service": "Bocchi Chord Search", "version": "1.0.0", "claude_cli": bool(CLAUDE_CLI)}


@app.get("/health")
async def health():
    return {"status": "healthy", "claude_cli": bool(CLAUDE_CLI)}


@app.post("/api/chord-search/", response_model=ChordSearchResponse)
async def search_chords(req: ChordSearchRequest):
    if not CLAUDE_CLI:
        raise HTTPException(status_code=503, detail="Claude CLI not found. Set CLAUDE_CLI_PATH env or install claude.")

    _check_rate_limit()

    artist_hint = f" by {req.artist}" if req.artist else ""
    prompt = PROMPT_TEMPLATE.format(title=req.title, artist_hint=artist_hint)

    try:
        result = subprocess.run(
            [CLAUDE_CLI, "-p", prompt, "--output-format", "text"],
            capture_output=True,
            text=True,
            timeout=60,
        )
    except FileNotFoundError:
        logger.error("Claude CLI not found at %s", CLAUDE_CLI)
        raise HTTPException(status_code=503, detail="Claude CLI not found")
    except subprocess.TimeoutExpired:
        logger.error("Claude CLI timed out")
        raise HTTPException(status_code=504, detail="LLM response timeout")

    if result.returncode != 0:
        logger.error("Claude CLI failed (code %d): %s", result.returncode, result.stderr[:500])
        raise HTTPException(status_code=502, detail="LLM call failed")

    raw = result.stdout.strip()

    # Extract JSON from response (may have markdown fences)
    if "```" in raw:
        start = raw.find("```")
        end = raw.rfind("```")
        inner = raw[start:end + 3] if end > start else raw[start:]
        inner = inner.split("\n", 1)[-1] if "\n" in inner else inner
        if inner.endswith("```"):
            inner = inner[:-3]
        raw = inner.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Failed to parse CLI output as JSON: %s", raw[:300])
        raise HTTPException(status_code=500, detail="Failed to parse LLM response")

    if "sections" not in data:
        raise HTTPException(status_code=500, detail="LLM response missing sections")

    now = datetime.now(timezone.utc).isoformat()

    try:
        sections = [
            SongSectionEntry(
                name=s.get("name", "Other"),
                chords=[
                    SongChordEntry(
                        chord=c.get("chord", "?"),
                        beats=c.get("beats", 4),
                        annotation=c.get("annotation"),
                    )
                    for c in s.get("chords", [])
                ],
            )
            for s in data["sections"]
            if isinstance(s, dict)
        ]
    except (TypeError, KeyError) as e:
        logger.error("Failed to parse sections: %s", e)
        raise HTTPException(status_code=500, detail="Failed to parse LLM response structure")

    if not sections:
        raise HTTPException(status_code=500, detail="LLM returned empty sections")

    ts = data.get("timeSignature")
    if isinstance(ts, list) and len(ts) == 2:
        ts = [int(ts[0]), int(ts[1])]
    else:
        ts = None

    return ChordSearchResponse(
        id=f"llm-{uuid.uuid4().hex[:12]}",
        title=data.get("title", req.title),
        artist=data.get("artist", req.artist),
        genre=data.get("genre"),
        key=data.get("key"),
        bpm=data.get("bpm"),
        timeSignature=ts,
        sections=sections,
        source="llm",
        createdAt=now,
        updatedAt=now,
    )


# ══════════════════════════════════════════════════════════════
# Guitar Pro Tab Parser
# ══════════════════════════════════════════════════════════════

GP_EXTENSIONS = {".gp", ".gp3", ".gp4", ".gp5", ".gpx", ".gp7"}


@app.post("/api/parse/tab")
async def parse_tab(
    file: UploadFile = File(...),
    track: str = Query(default=None, description="Track name or index (e.g. 'Bass' or '0')"),
):
    """Parse Guitar Pro file → BocchiMaster Track JSON."""
    suffix = Path(file.filename or "tab.gp5").suffix.lower()
    if suffix not in GP_EXTENSIONS:
        raise HTTPException(400, f"Unsupported format: {suffix}. Use: {', '.join(GP_EXTENSIONS)}")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Parse track parameter: try int first, then string
        target_track = None
        if track is not None:
            try:
                target_track = int(track)
            except ValueError:
                target_track = track

        result = parse_gp_file(tmp_path, target_track=target_track)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error("Tab parse failed: %s", e)
        raise HTTPException(500, f"Parse failed: {e}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return JSONResponse(content=result)
