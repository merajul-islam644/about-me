#!/bin/sh
# Runs at container start (nginx:alpine executes /docker-entrypoint.d/*.sh
# before starting nginx). Writes every VITE_* environment variable into
# env.js — the release secret set reaches the app at RUNTIME, not build
# time, so a static Vite bundle needs this bridge to see its config.
set -e

out=/usr/share/nginx/html/env.js
{
  printf 'window.__ENV__ = window.__ENV__ || {};\n'
  env | grep '^VITE_' | while IFS='=' read -r key value; do
    escaped=$(printf '%s' "$value" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
    printf 'window.__ENV__["%s"] = "%s";\n' "$key" "$escaped"
  done
} > "$out"
