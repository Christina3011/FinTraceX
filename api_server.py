"""Minimal Groq explanation API for local development.

Run from the repository root with:
    python api_server.py
"""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("API_PORT", "8787"))
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def load_env_file() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        if name.strip() == "GROQ_API_KEY" and value.strip():
            os.environ.setdefault("GROQ_API_KEY", value.strip().strip('"\''))


def explain(payload: dict) -> str:
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured. Add GROQ_API_KEY=... to the root .env file.")
    transaction = payload.get("transaction", {})
    evidence = payload.get("evidence", [])
    prompt = (
        "Explain this financial transaction for a fraud analyst in 2-3 concise sentences. "
        "Do not invent facts. Mention only supplied evidence and state uncertainty when evidence is pending.\n\n"
        f"Transaction: {json.dumps(transaction, ensure_ascii=False)}\n"
        f"Evidence: {json.dumps(evidence, ensure_ascii=False)}"
    )
    body = json.dumps({
        "model": "llama-3.1-8b-instant",
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": "You are a careful fraud-intelligence analyst."},
            {"role": "user", "content": prompt},
        ],
    }).encode("utf-8")
    request = Request(GROQ_URL, data=body, headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }, method="POST")
    with urlopen(request, timeout=30) as response:
        result = json.loads(response.read().decode("utf-8"))
    return result["choices"][0]["message"]["content"].strip()


class ApiHandler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "http://localhost:8443")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:
        self._send(204, {})

    def do_POST(self) -> None:
        if self.path != "/api/explain":
            self._send(404, {"error": "Endpoint not found."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload.get("transaction"), dict):
                raise ValueError("transaction must be an object.")
            self._send(200, {"explanation": explain(payload)})
        except ValueError as error:
            self._send(400, {"error": str(error)})
        except Exception as error:
            self._send(502, {"error": str(error)})

    def log_message(self, format: str, *args: object) -> None:
        print(format % args)


if __name__ == "__main__":
    load_env_file()
    print(f"Groq explanation API listening on http://localhost:{PORT}")
    ThreadingHTTPServer(("localhost", PORT), ApiHandler).serve_forever()
