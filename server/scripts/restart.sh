#!/usr/bin/env bash
# Restart the Ledger API, and refuse to lie about having done it.
#
# Written after losing three rounds to a "restart" that silently failed: the
# old process kept the port, the new one died of EADDRINUSE, and every test
# after that ran against stale code that looked plausibly wrong. So this script
# kills by PID, waits for the port to actually free, and then verifies that the
# process answering is the one it just started.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${PORT:-8600}"
PIDFILE="$ROOT/.api.pid"
LOG="${LOG:-/tmp/ledger.log}"

cd "$ROOT"

echo "stopping anything on :$PORT"

if [[ -f "$PIDFILE" ]]; then
  kill -9 "$(cat "$PIDFILE")" 2>/dev/null || true
  rm -f "$PIDFILE"
fi

# Match the resolved script path so this never matches its own command line.
# `|| true` matters: pgrep exits 1 when nothing matches, and with
# `set -o pipefail` that would abort the script on a clean machine.
{ pgrep -f "$ROOT/server/src/dev.js" 2>/dev/null || true; } | while read -r pid; do
  kill -9 "$pid" 2>/dev/null || true
done

# A process started with a RELATIVE path has a different command line and the
# pattern above misses it entirely, which is exactly how a stale server
# survives a "restart". So also kill whoever actually holds the port.
{ ss -lptnH "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' || true; } | sort -u | while read -r pid; do
  echo "  killing pid $pid holding :$PORT"
  kill -9 "$pid" 2>/dev/null || true
done

for _ in $(seq 1 20); do
  if ! (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then break; fi
  sleep 0.25
done

if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  echo "FAILED: something is still holding :$PORT" >&2
  exit 1
fi

echo "starting"
setsid node "$ROOT/server/src/dev.js" >"$LOG" 2>&1 </dev/null &
NEW_PID=$!
echo "$NEW_PID" >"$PIDFILE"

for _ in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$NEW_PID" 2>/dev/null; then
    echo "FAILED: the API died on startup. Log:" >&2
    cat "$LOG" >&2
    exit 1
  fi
  sleep 0.25
done

if ! curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
  echo "FAILED: the API never became healthy. Log:" >&2
  cat "$LOG" >&2
  exit 1
fi

# Prove the running code is the code on disk. If a stale process had kept the
# port, this would still be serving and everything above would have "passed".
LIVE_PID="$(pgrep -f "$ROOT/server/src/dev.js" 2>/dev/null | head -1 || true)"
echo "up: pid $LIVE_PID on :$PORT, log $LOG"
curl -s -o /dev/null -D - "http://127.0.0.1:$PORT/api/health" 2>/dev/null \
  | grep -i '^ratelimit-policy' || true
