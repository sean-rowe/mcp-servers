#!/usr/bin/env python3
"""Read transcript lines on stdin and forward them to the spotter daemon.

The daemon (`scripts/spotter-daemon.py`) listens on a Unix socket, persists
each line in the SQLite `transcripts` table, and triggers `claude -p` to
run the transcript-spotter skill in near-real-time.

Usage:
    whisper-stream -m model.bin ... | python3 ingest.py
    whisperkit-cli transcribe --stream ... | python3 ingest.py

Env:
    TRANSCRIPT_SPOTTER_SOCK   override socket path
    TRANSCRIPT_SPEAKER        optional speaker tag attached to every line
"""

import json
import os
import re
import socket
import sys
from pathlib import Path

DEFAULT_SOCK = Path.home() / "Library/Application Support/transcript-spotter/spotter.sock"
SOCK_PATH = Path(os.environ.get("TRANSCRIPT_SPOTTER_SOCK", DEFAULT_SOCK))

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
    speaker = os.environ.get("TRANSCRIPT_SPEAKER")

    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        sock.connect(str(SOCK_PATH))
    except (FileNotFoundError, ConnectionRefusedError) as e:
        sys.stderr.write(
            f"Cannot connect to spotter daemon at {SOCK_PATH}: {e}\n"
            "Start the daemon first:  python3 scripts/spotter-daemon.py\n"
        )
        return 1

    out = sock.makefile("wb")
    try:
        for raw in sys.stdin:
            text = clean(raw)
            if not text:
                continue
            payload = (json.dumps({"text": text, "speaker": speaker}) + "\n").encode("utf-8")
            out.write(payload)
            out.flush()
    except KeyboardInterrupt:
        pass
    except BrokenPipeError:
        sys.stderr.write("spotter daemon disconnected\n")
        return 1
    finally:
        out.close()
        sock.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
