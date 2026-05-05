#!/usr/bin/env bash
set -euo pipefail

DB="${TRANSCRIPT_SPOTTER_DB:-$HOME/Library/Application Support/transcript-spotter/spotter.db}"
mkdir -p "$(dirname "$DB")"

sqlite3 "$DB" <<'SQL'
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS transcripts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           TEXT    NOT NULL DEFAULT (datetime('now')),
  text         TEXT    NOT NULL,
  speaker      TEXT,
  processed_at TEXT
);

CREATE TABLE IF NOT EXISTS opportunities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  transcript_id INTEGER NOT NULL REFERENCES transcripts(id),
  kind          TEXT    NOT NULL CHECK (kind IN
                  ('task','question','point','volunteer','update')),
  text          TEXT    NOT NULL,
  context       TEXT,
  confidence    REAL    NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transcripts_unprocessed
  ON transcripts(id) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_kind
  ON opportunities(kind, created_at);
SQL

echo "Initialized $DB"
