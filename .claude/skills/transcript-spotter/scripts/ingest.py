#!/usr/bin/env python3
"""Read transcript lines on stdin, insert into the spotter SQLite DB.

Usage:
    whisper-stream -m model.bin ... | python3 ingest.py
    whisperkit-cli transcribe --stream ... | python3 ingest.py
"""

import os
import re
import sqlite3
import sys
from pathlib import Path

DEFAULT_DB = Path.home() / "Library/Application Support/transcript-spotter/spotter.db"
DB_PATH = Path(os.environ.get("TRANSCRIPT_SPOTTER_DB", DEFAULT_DB))

# whisper.cpp stream prepends "[HH:MM:SS.mmm --> HH:MM:SS.mmm]  " and uses ANSI.
# Match only that exact shape so non-timestamp brackets like "[laughter]" survive.
ANSI = re.compile(r"\x1b\[[0-9;]*m")
TIMESTAMP = re.compile(
    r"^\s*\[\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?\s*-->\s*"
    r"\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?\]\s*"
)


def clean(line: str) -> str:
    line = ANSI.sub("", line)
    line = TIMESTAMP.sub("", line)
    return line.strip()


def main() -> int:
    if not DB_PATH.exists():
        sys.stderr.write(f"DB not found at {DB_PATH}; run scripts/init.sh first.\n")
        return 1

    # Autocommit (per-row commit) is intentional: the spotter skill polls for
    # unprocessed rows and we want each transcript line visible immediately.
    # WAL + synchronous=NORMAL keeps the cost negligible at speech rates.
    conn = sqlite3.connect(DB_PATH, isolation_level=None)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")

    speaker = os.environ.get("TRANSCRIPT_SPEAKER")

    try:
        for raw in sys.stdin:
            text = clean(raw)
            if not text:
                continue
            conn.execute(
                "INSERT INTO transcripts (text, speaker) VALUES (?, ?);",
                (text, speaker),
            )
    except KeyboardInterrupt:
        pass
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
