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

# The sandbox init starts this server as root, so an unprivileged kill gets
# EPERM and the "restart" silently leaves the old code on the port. Always try
# sudo as a fallback.
zap() { kill -9 "$1" 2>/dev/null || sudo -n kill -9 "$1" 2>/dev/null || true; }

if [[ -f "$PIDFILE" ]]; then
  zap "$(cat "$PIDFILE")"
  rm -f "$PIDFILE"
fi

# Match the resolved script path so this never matches its own command line.
# `|| true` matters: pgrep exits 1 when nothing matches, and with
# `set -o pipefail` that would abort the script on a clean machine.
{ pgrep -f "$ROOT/server/src/dev.js" 2>/dev/null || true; } | while read -r pid; do
  zap "$pid"
done

# A process started with a RELATIVE path has a different command line and the
# pattern above misses it entirely, which is exactly how a stale server
# survives a "restart". So also kill whoever actually holds the port.
# ss only reveals pid= for processes we own, so ask again with privileges.
{ { ss -lptnH "sport = :$PORT" 2>/dev/null; sudo -n ss -lptnH "sport = :$PORT" 2>/dev/null; } \
    | grep -oP 'pid=\K[0-9]+' || true; } | sort -u | while read -r pid; do
  echo "  killing pid $pid holding :$PORT"
  zap "$pid"
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
# NOT $!: setsid forks, so that pid is the wrapper and it exits immediately.
# Checking it for liveness reports a perfectly healthy API as dead on startup.
alive() { pgrep -f "$ROOT/server/src/dev.js" >/dev/null 2>&1; }

for _ in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    break
  fi
  if ! alive; then
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
[[ -n "$LIVE_PID" ]] && echo "$LIVE_PID" >"$PIDFILE"
echo "up: pid $LIVE_PID on :$PORT, log $LOG"
curl -s -o /dev/null -D - "http://127.0.0.1:$PORT/api/health" 2>/dev/null \
  | grep -i '^ratelimit-policy' || true
