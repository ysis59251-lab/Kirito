#!/usr/bin/env python3
"""AnimeFume middle server: static files plus a same-origin Google Sheets proxy."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse
from urllib.request import Request, urlopen
from html import escape
import json
import os
from pathlib import PurePosixPath

ROOT = os.path.dirname(os.path.abspath(__file__))
SHEET_ID = '1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        # Never expose repository metadata, dotenv files, or Python caches through this convenience server.
        decoded = unquote(urlparse(path).path)
        if any(part.startswith('.') and part != '.well-known' or part == '__pycache__' for part in PurePosixPath(decoded).parts):
            return os.path.join(ROOT, '__blocked__')
        return super().translate_path(path)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/home.html':
            self.serve_home_with_rows()
            return
        if parsed.path == '/api/sheet':
            sheet = parse_qs(parsed.query).get('name', ['Sheet1'])[0]
            if not sheet or len(sheet) > 80:
                self.send_error(400, 'Invalid sheet name')
                return
            target = (
                f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/'
                f'tq?tqx=out:json&sheet={__import__("urllib.parse", fromlist=["quote"]).quote(sheet)}'
            )
            try:
                with urlopen(Request(target, headers={'User-Agent': 'AnimeFume-Middle-Server/1.0'}), timeout=20) as response:
                    body = response.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/javascript; charset=utf-8')
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)
            except Exception as error:
                self.send_error(502, f'Google Sheets unavailable: {error}')
            return
        super().do_GET()

    def serve_home_with_rows(self):
        path = os.path.join(ROOT, 'home.html')
        try:
            with open(path, encoding='utf-8') as file:
                html = file.read()
            rows = self.load_rows('Sheet1')
            cards = []
            for row in rows[:40]:
                title = str(row.get('title') or 'ไม่มีชื่อ')
                ident = str(row.get('id') or title)
                link = str(row.get('link') or f'folder-name/{ident}.html')
                if link.startswith('folder-name') and '/' not in link:
                    link = link.replace('folder-name', 'folder-name/', 1)
                cards.append(
                    f'<a class="anime-card" href="{escape(link, quote=True)}" '
                    f'data-id="{escape(ident, quote=True)}" data-title="{escape(title, quote=True)}" '
                    f'data-year="{escape(str(row.get("year") or "0"), quote=True)}" data-search="1" data-hidden="0">'
                    f'<div class="card-img"><img loading="lazy" src="{escape(str(row.get("image") or ""), quote=True)}" '
                    f'alt="{escape(title, quote=True)}"><div class="overlay">{escape(title)}</div></div></a>'
                )
            rendered = ''.join(cards)
            html = html.replace('<main class="anime-list" id="animeList" aria-live="polite"></main>',
                                f'<main class="anime-list" id="animeList" aria-live="polite">{rendered}</main>')
            body = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as error:
            self.send_error(502, f'Home data unavailable: {error}')

    @staticmethod
    def load_rows(sheet):
        target = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={sheet}'
        with urlopen(Request(target, headers={'User-Agent': 'AnimeFume-Middle-Server/1.0'}), timeout=20) as response:
            text = response.read().decode('utf-8')
        payload = json.loads(text[text.index('setResponse(') + len('setResponse('):].rstrip(');\n'))
        columns = [column.get('label') or column.get('id') or f'column{i}' for i, column in enumerate(payload['table']['cols'])]
        return [{columns[i]: (cell or {}).get('v', '') for i, cell in enumerate(row.get('c', []))} for row in payload['table'].get('rows', [])]

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8769'))
    host = os.environ.get('BIND_HOST', '127.0.0.1')
    if host not in {'127.0.0.1', 'localhost', '::1'}:
        print('WARNING: non-loopback bind exposes this static server to the network; place it behind access controls.', flush=True)
    server = ThreadingHTTPServer((host, port), Handler)
    print(f'AnimeFume middle server listening on http://{host}:{port}', flush=True)
    server.serve_forever()
