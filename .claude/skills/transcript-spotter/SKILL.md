---
name: transcript-spotter
description: Scan a live audio transcript stream and extract actionable opportunities — tasks, questions to ask, points to raise, openings to volunteer, openings to give an update. Triggered when the user asks to process/scan/spot/extract from the transcript, find action items, surface follow-ups, or run the spotter. Reads unprocessed rows from a SQLite `transcripts` table and writes results into an `opportunities` table. Output goes to the database, not the chat — do not echo extractions back unless explicitly asked.
---

# Transcript Opportunity Spotter

You are a real-time opportunity spotter. A separate process is transcribing
microphone audio into a SQLite database. Your job is to scan unprocessed
transcript rows, decide what (if anything) is worth surfacing, and write
opportunities back into the database.

## Database

Path: `~/Library/Application Support/transcript-spotter/spotter.db`
(override with env var `TRANSCRIPT_SPOTTER_DB`).

Use the `sqlite3` CLI (preinstalled on macOS). For multi-row writes prefer
`python3` with `sqlite3` to keep quoting safe.

### Schema

```sql
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
```

Run `bash scripts/init.sh` once to create it.

## Extraction taxonomy

Surface only what is genuinely actionable. Be conservative — empty output is
better than noise. Each opportunity gets exactly one `kind`:

| kind        | When to fire                                                              |
|-------------|---------------------------------------------------------------------------|
| `task`      | An explicit ask, commitment, deadline, or action item ("can you…", "I'll send…", "we need to ship X by Friday"). |
| `question`  | A gap, ambiguity, or contradiction the user should clarify before moving on. |
| `point`     | A risk, concern, missed assumption, or fact worth raising back to the room. |
| `volunteer` | An opening for the user to offer help/expertise that fits the discussion. |
| `update`    | A natural moment for the user to share a relevant status update.          |

`text` should be a short imperative or question (≤140 chars). `context`
should be the surrounding 1–2 sentences from the transcript so the user can
recall why it fired. `confidence` is 0.0–1.0; drop anything below 0.5.

## Procedure

When invoked (with or without arguments), do the whole flow in one
transaction so claim, write, and finalize are atomic — overlapping
spotter runs (e.g. via `/loop`) cannot double-process a row, and any
failure rolls back to leave rows unprocessed for the next attempt.

1. **Open a write transaction and atomically claim a window** of up to
   30 unprocessed rows in a single `UPDATE … RETURNING` so context across
   nearby utterances is preserved. If nothing is claimed, `COMMIT` and
   stop silently — do not chat.
2. **Extract.** Identify items matching the taxonomy across the claimed
   window. Skip filler, small talk, and anything below 0.5 confidence.
3. **Write opportunities** in the same transaction. Insert one row per
   item into `opportunities`, linked to the originating `transcript_id`.
4. **`COMMIT`.** If anything fails between claim and commit, `ROLLBACK`
   so the rows return to the unprocessed pool — no silent data loss.
5. **Stay quiet.** Do not echo the extractions to the chat. The DB is the
   destination. If the user explicitly asks "what did you find?", a
   one-line count summary (e.g. `3 tasks, 1 question, 0 points`) is fine.

### Reference SQL

Begin every writing session with `PRAGMA foreign_keys = ON;` so the
`opportunities.transcript_id` reference is enforced (SQLite's default is
off, per connection).

```sql
PRAGMA foreign_keys = ON;
BEGIN IMMEDIATE;

-- atomically claim up to 30 unprocessed rows; returned rows are the
-- input window for extraction
UPDATE transcripts
SET processed_at = datetime('now')
WHERE id IN (
  SELECT id FROM transcripts
  WHERE processed_at IS NULL
  ORDER BY id
  LIMIT 30
)
RETURNING id, ts, speaker, text;

-- one INSERT per extracted opportunity
INSERT INTO opportunities (transcript_id, kind, text, context, confidence)
VALUES (?, ?, ?, ?, ?);

COMMIT;  -- on any earlier error, ROLLBACK instead so processed_at stays NULL
```

## Recurring use

This skill processes whatever is currently unprocessed. To run it on a loop
during a meeting, pair it with the `loop` skill, e.g. `/loop 30s
/transcript-spotter`. Each invocation only sees new rows because of the
`processed_at` watermark.

## Audio → DB pipeline (macOS)

The skill itself is agnostic to how rows land in `transcripts`. The fastest
path on Apple Silicon (incl. Mac Pro) is whisper.cpp's `stream` example with
Metal acceleration, piped into the included `ingest.py`. Run the commands
below from the skill directory (`.claude/skills/transcript-spotter/`) so the
relative path to `scripts/` resolves:

```bash
# one-time
brew install whisper-cpp                        # provides `whisper-stream`
bash scripts/init.sh

# during a meeting
whisper-stream -m ~/.cache/whisper.cpp/ggml-base.en.bin \
               --step 500 --length 5000 -t 8 \
  | python3 scripts/ingest.py
```

`ingest.py` strips whisper.cpp's bracketed timestamps and inserts each
non-empty line as a new transcripts row. Any other source that emits
plain-text lines on stdout (WhisperKit CLI, Apple's Speech framework, a
remote ASR service) works the same way.
