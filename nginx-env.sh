#!/bin/sh
# The CMD wrapper's first step: writes every VITE_* environment variable
# into env.js — the release secret set reaches the app at RUNTIME, not
# build time, so a static Vite bundle needs this bridge to see its config.
# Best-effort on purpose: if the write fails, nginx must still start and
# serve the public pages (only login/mail need the config).
out=/usr/share/nginx/html/env.js
tmp="$out.tmp"
{
  printf 'window.__ENV__ = window.__ENV__ || {};\n'
  env | grep '^VITE_' | while IFS='=' read -r key value; do
    escaped=$(printf '%s' "$value" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
    printf 'window.__ENV__["%s"] = "%s";\n' "$key" "$escaped"
  done
} > "$tmp" && mv "$tmp" "$out" || true
