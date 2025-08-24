#!/usr/bin/env bash
set -euo pipefail

# Simple report + optional cleanup for test Chromium processes and profiles

PATTERN="/tmp/chromium-test-profile-"

confirm() {
  local prompt=${1:-Are you sure?}
  read -r -p "${prompt} [y/N] " _ans || true
  case "${_ans:-}" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}

echo "=== Chromium Test Profile Maintenance ==="

# 1) Processes
echo "[1/2] Processes using test profiles:"
pids="$(pgrep -f -- "--user-data-dir=${PATTERN}" || true)"
if [ -n "$pids" ]; then
  pcount="$(echo "$pids" | wc -l | tr -d ' ')"
  echo "Found ${pcount} process(es)."
  if confirm "Kill these processes (SIGKILL)?"; then
    pkill -KILL -f -- "--user-data-dir=${PATTERN}" || true
    echo "Processes killed."
  else
    echo "Skipping process termination. Cannot safely remove profiles while processes are running."
    echo "Exiting without scanning/removing profile directories."
    exit 0
  fi
else
  echo "No matching Chromium processes found."
fi

# 2) Profiles
echo "[2/2] Test profile directories:"
# Safe glob count to avoid pipefail when no matches
shopt -s nullglob
profiles=(/tmp/chromium-test-profile-*)
count=${#profiles[@]}
shopt -u nullglob
if [ "$count" != "0" ]; then
  echo "Found ${count} directory(ies)."
  if confirm "Remove these directories?"; then
    rm -rf -- /tmp/chromium-test-profile-* || true
    echo "Directories removed."
  else
    echo "Skipping directory removal."
  fi
else
  echo "No test profile directories found."
fi

echo "Done."
