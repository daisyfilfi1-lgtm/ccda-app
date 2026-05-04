#!/usr/bin/env python3
"""Anthropic -> OpenAI proxy for Claude Code using DeepSeek (threaded)."""
import json, sys, urllib.request, socketserver
from http.server import HTTPServer, BaseHTTPRequestHandler

DEEPSEEK_API = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"
API_KEY = "sk-e49f6b79efb54818966f5244ab75a180"

class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if "/v1/models" in self.path:
            self._ok({"data":[{"id":DEEPSEEK_MODEL,"object":"model"}]})
        else:
            self.send_response(404); self.end_headers()
    def do_POST(self):
        length = int(self.headers.get("Content-Length",0))
        body = self.rfile.read(length)
        if "/v1/messages" in self.path:
            self._messages(json.loads(body))
        else:
            self.send_response(404); self.end_headers()
    def _ok(self, d):
        b=json.dumps(d).encode()
        self.send_response(200)
        self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(b)))
        self.end_headers()
        self.wfile.write(b)
    def _err(self, code, msg):
        b=json.dumps({"error":{"message":msg}}).encode()
        self.send_response(code)
        self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(b)))
        self.end_headers()
        self.wfile.write(b)
    def _messages(self, areq):
        msgs = []
        for msg in areq.get("messages",[]):
            content = ""
            if isinstance(msg.get("content"),list):
                for b in msg["content"]:
                    if b.get("type")=="text": content+=b["text"]
            else: content=msg.get("content","")
            msgs.append({"role":msg["role"],"content":content})
        sp = areq.get("system","")
        if isinstance(sp,list) and sp: sp=sp[0].get("text","")
        oreq = {
            "model": DEEPSEEK_MODEL,
            "messages": [],
            "max_tokens": areq.get("max_tokens",4096),
            "temperature": areq.get("temperature",0.7),
            "stream": False,
        }
        if sp: oreq["messages"].append({"role":"system","content":sp})
        oreq["messages"].extend(msgs)
        sys.stderr.write(f"[proxy] -> DeepSeek: {len(msgs)} msgs\n")
        sys.stderr.flush()
        try:
            r = urllib.request.Request(
                f"{DEEPSEEK_API}/v1/chat/completions",
                data=json.dumps(oreq).encode(),
                headers={"Content-Type":"application/json","Authorization":f"Bearer {API_KEY}"},
                method="POST",
            )
            resp = json.loads(urllib.request.urlopen(r,timeout=60).read())
            c = resp["choices"][0]
            aresp = {
                "id": resp.get("id","msg_p"),
                "type": "message",
                "role": "assistant",
                "content": [{"type":"text","text":c["message"].get("content","")}],
                "model": DEEPSEEK_MODEL,
                "stop_reason": "end_turn" if c.get("finish_reason")=="stop" else c.get("finish_reason","end_turn"),
                "usage": {
                    "input_tokens": resp.get("usage",{}).get("prompt_tokens",0),
                    "output_tokens": resp.get("usage",{}).get("completion_tokens",0),
                },
            }
            sys.stderr.write(f"[proxy] <- DeepSeek: {len(c['message'].get('content',''))} chars\n")
            sys.stderr.flush()
            self._ok(aresp)
        except Exception as e:
            sys.stderr.write(f"[proxy] ERROR: {e}\n")
            sys.stderr.flush()
            import traceback; traceback.print_exc(file=sys.stderr)
            self._err(500, str(e))

if __name__=="__main__":
    port = int(sys.argv[1]) if len(sys.argv)>1 else 8080
    s = ThreadingHTTPServer(("0.0.0.0",port), Handler)
    sys.stderr.write(f"[proxy] Listening on :{port} -> {DEEPSEEK_API}\n")
    sys.stderr.flush()
    s.serve_forever()
