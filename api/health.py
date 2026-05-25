"""
Health check endpoint for uptime monitoring: GET /api/health -> {"status": "ok"}.
"""

import json
import os
from http.server import BaseHTTPRequestHandler


def cors_origin():
    return os.environ.get("ALLOWED_ORIGIN", "*")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", cors_origin())
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok"}).encode())
