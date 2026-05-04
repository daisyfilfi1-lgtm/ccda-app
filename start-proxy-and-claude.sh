#!/usr/bin/env bash
# Start Anthropic-to-DeepSeek proxy, then launch Claude Code
set -e

PROXY_PORT=15721
PROXY_LOG="/tmp/proxy.log"
CCDA_DIR="/home/ccda/ccda-app"
API_KEY="sk-e49f6b79efb54818966f5244ab75a180"

# Kill any existing proxy on this port
lsof -ti:$PROXY_PORT 2>/dev/null | xargs -r kill -9 2>/dev/null || true
sleep 1

# Start proxy in background
PROVIDER=deepseek API_KEY="$API_KEY" LOG_LEVEL=info \
  python3 /root/anthropic_proxy.py > "$PROXY_LOG" 2>&1 &
PROXY_PID=$!
echo "Proxy PID: $PROXY_PID"
sleep 2

# Verify proxy is up
if ! curl -sf http://127.0.0.1:$PROXY_PORT/health > /dev/null 2>&1; then
  echo "ERROR: Proxy failed to start"
  cat "$PROXY_LOG"
  exit 1
fi
echo "Proxy healthy on :$PROXY_PORT"

# Launch Claude Code as ccda user with the proxy
sudo -u ccda bash -c "
  cd $CCDA_DIR
  export ANTHROPIC_BASE_URL=http://127.0.0.1:$PROXY_PORT
  export ANTHROPIC_API_KEY=x
  export CLAUDE_MODEL=deepseek-chat
  echo 'Starting Claude Code...'
  claude --bare
"
