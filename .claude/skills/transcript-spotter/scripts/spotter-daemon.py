#!/usr/bin/env python3
"""Realtime transcript-spotter daemon.

Listens on a Unix-domain socket for transcript lines from `ingest.py`,
persists each line in the SQLite `transcripts` table, and debounces
invocations of `claude -p` so the transcript-spotter skill runs against
new rows in near-real-time.

Wire protocol (newline-delimited):
    {"text": "...", "speaker": "alice|null"}\\n

Trigger:
    fire `claude -p` when EITHER the buffer reaches FLUSH_LINES new rows
    OR the mic has been idle for FLUSH_IDLE_S seconds with rows pending.
    Concurrent triggers during a running invocation are coalesced into
    one re-run — never two `claude -p` processes at once.

Env overrides:
    TRANSCRIPT_SPOTTER_SOCK             socket path
    TRANSCRIPT_SPOTTER_DB               sqlite db path
    TRANSCRIPT_SPOTTER_WORKDIR          cwd for `claude -p`
    TRANSCRIPT_SPOTTER_FLUSH_LINES      buffer-size trigger (default 8)
    TRANSCRIPT_SPOTTER_FLUSH_IDLE       idle-seconds trigger (default 3.0)
    TRANSCRIPT_SPOTTER_PROMPT           prompt passed to `claude -p`
    TRANSCRIPT_SPOTTER_PERMISSION_MODE  passed through to `claude -p`
"""

import json
import os
import signal
import socket
import sqlite3
import subprocess
import sys
import threading
import time
from pathlib import Path

DEFAULT_BASE = Path.home() / "Library/Application Support/transcript-spotter"
SOCK_PATH = Path(os.environ.get("TRANSCRIPT_SPOTTER_SOCK", DEFAULT_BASE / "spotter.sock"))
DB_PATH = Path(os.environ.get("TRANSCRIPT_SPOTTER_DB", DEFAULT_BASE / "spotter.db"))
WORKDIR = os.environ.get("TRANSCRIPT_SPOTTER_WORKDIR", str(Path.cwd()))
FLUSH_LINES = max(1, int(os.environ.get("TRANSCRIPT_SPOTTER_FLUSH_LINES", "8")))
FLUSH_IDLE_S = max(0.1, float(os.environ.get("TRANSCRIPT_SPOTTER_FLUSH_IDLE", "3.0")))
CLAUDE_PROMPT = os.environ.get(
    "TRANSCRIPT_SPOTTER_PROMPT",
    "Run the transcript-spotter skill on any unprocessed rows and exit.",
)
PERMISSION_MODE = os.environ.get(
    "TRANSCRIPT_SPOTTER_PERMISSION_MODE", "bypassPermissions"
)

state_lock = threading.Lock()
pending_count = 0
last_signal_ts = 0.0
trigger = threading.Event()
shutdown = threading.Event()


def open_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, isolation_level=None)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn


def signal_arrival() -> None:
    """Record a new transcript line; fire trigger if buffer is full."""
    global pending_count, last_signal_ts
    fire = False
    with state_lock:
        pending_count += 1
        last_signal_ts = time.monotonic()
        if pending_count >= FLUSH_LINES:
            pending_count = 0
            fire = True
    if fire:
        trigger.set()


def idle_watcher() -> None:
    """Fire trigger after FLUSH_IDLE_S seconds of silence with pending rows."""
    global pending_count
    while not shutdown.is_set():
        if shutdown.wait(timeout=0.5):
            return
        fire = False
        with state_lock:
            if pending_count > 0 and (time.monotonic() - last_signal_ts) >= FLUSH_IDLE_S:
                pending_count = 0
                fire = True
        if fire:
            trigger.set()


def runner() -> None:
    """Spawn `claude -p` whenever the trigger fires; coalesce overlaps."""
    while not shutdown.is_set():
        if not trigger.wait(timeout=1.0):
            continue
        trigger.clear()
        if shutdown.is_set():
            return
        try:
            subprocess.run(
                [
                    "claude",
                    "-p",
                    CLAUDE_PROMPT,
                    "--permission-mode",
                    PERMISSION_MODE,
                    "--output-format",
                    "text",
                ],
                cwd=WORKDIR,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        except FileNotFoundError:
            sys.stderr.write("`claude` CLI not on PATH; cannot extract.\n")
        except Exception as e:
            sys.stderr.write(f"claude -p failed: {e}\n")


def handle_client(client: socket.socket) -> None:
    db = open_db()
    f = client.makefile("rb")
    try:
        for raw in f:
            line = raw.decode("utf-8", "replace").strip()
            if not line:
                continue
            text = None
            speaker = None
            try:
                obj = json.loads(line)
                if isinstance(obj, dict):
                    t = obj.get("text")
                    if isinstance(t, str):
                        text = t.strip()
                    s = obj.get("speaker")
                    if isinstance(s, str):
                        speaker = s
            except json.JSONDecodeError:
                text = line
            if not text:
                continue
            db.execute(
                "INSERT INTO transcripts (text, speaker) VALUES (?, ?);",
                (text, speaker),
            )
            signal_arrival()
    finally:
        f.close()
        client.close()
        db.close()


def serve() -> None:
    SOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    if SOCK_PATH.exists():
        SOCK_PATH.unlink()
    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server.bind(str(SOCK_PATH))
    os.chmod(SOCK_PATH, 0o600)
    server.listen(8)
    server.settimeout(1.0)
    sys.stderr.write(
        f"transcript-spotter daemon listening on {SOCK_PATH}\n"
        f"  db={DB_PATH}\n"
        f"  workdir={WORKDIR}\n"
        f"  flush_lines={FLUSH_LINES} flush_idle={FLUSH_IDLE_S}s\n"
    )
    threading.Thread(target=idle_watcher, daemon=True).start()
    threading.Thread(target=runner, daemon=True).start()
    try:
        while not shutdown.is_set():
            try:
                client, _ = server.accept()
            except socket.timeout:
                continue
            threading.Thread(
                target=handle_client, args=(client,), daemon=True
            ).start()
    finally:
        server.close()
        try:
            SOCK_PATH.unlink()
        except FileNotFoundError:
            pass


def main() -> int:
    if not DB_PATH.exists():
        sys.stderr.write(f"DB not found at {DB_PATH}; run scripts/init.sh first.\n")
        return 1

    def _stop(*_args):
        shutdown.set()
        trigger.set()

    signal.signal(signal.SIGINT, _stop)
    signal.signal(signal.SIGTERM, _stop)
    serve()
    return 0


if __name__ == "__main__":
    sys.exit(main())
