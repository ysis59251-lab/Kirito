from pathlib import Path
import re

changed = []


def save(path: Path, text: str):
    old = path.read_text(encoding='utf-8')
    if old != text:
        path.write_text(text, encoding='utf-8')
        changed.append(str(path))


def inject(path: Path, src: str):
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    if src in text:
        return
    if '</head>' not in text:
        return
    save(path, text.replace('</head>', f'<script src="{src}"></script>\n</head>', 1))


# Shared core on public pages.
for name in ('home.html', 'index2.html', 'index3.html', 'search.html', 'history.html', 'sheet2.html'):
    inject(Path(name), 'animefume-core.js')

# Shared core on player pages.
player_root = Path('folder-name')
if player_root.exists():
    for path in player_root.iterdir():
        if path.is_file() and path.suffix.lower() in {'.html', '.hrml'}:
            inject(path, '../animefume-core.js')

# Repair the known typo that breaks the Sheet2 link for id 243.
bad = player_root / '243.hrml'
good = player_root / '243.html'
if bad.exists() and not good.exists():
    bad.rename(good)
    changed.append(str(good))

# Home uses embedded Sheet2 data, never the Sheet2 network endpoint.
home = Path('home.html')
if home.exists():
    text = home.read_text(encoding='utf-8')
    if 'sheet2-data.js' not in text:
        marker = '<script type="module" src="script.js"></script>'
        if marker in text:
            text = text.replace(marker, '<script src="sheet2-data.js"></script>\n' + marker, 1)
    text = re.sub(
        r"\s*const SHEET2_URL='https://opensheet\.elk\.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet2';\s*",
        '\n', text, count=1
    )
    pattern = re.compile(r"\s*async function loadSheet2\(\)\{.*?\n\s*\}\n", re.S)
    replacement = '''
async function loadSheet2(){
    try{
      const data = await loadEmbeddedSheet2Data();
      sheet2Rows = Array.isArray(data)
        ? data.filter(r => String(r.Show ?? '').toUpperCase() !== 'TRUE')
        : [];
      sheet2Page = 1;
      sheet2Render();
    }catch(e){
      console.error('embedded Sheet2 error', e);
      sheet2Rows = [];
      sheet2Filtered = [];
      const status = document.getElementById('sheet2Status');
      if(status) status.textContent = 'โหลดข้อมูลไม่สำเร็จ';
      const grid = document.getElementById('sheet2Grid');
      if(grid) grid.innerHTML = '<div class="sheet2-empty">ไม่สามารถโหลดรายการได้</div>';
    }
  }
'''
    text2 = pattern.sub(replacement, text, count=1)
    save(home, text2)

# History supports both player-system and core history formats.
history = Path('history.html')
if history.exists():
    text = history.read_text(encoding='utf-8')
    text = text.replace("a.href=x.page||'#';", "a.href=x.page||x.link||'#';")
    text = text.replace(
        "tm.textContent=x.time?new Date(x.time).toLocaleString('th-TH'):'';",
        "tm.textContent=(x.time||x.watchedAt)?new Date(x.time||x.watchedAt).toLocaleString('th-TH'):'';"
    )
    save(history, text)

print(f'Integrated {len(changed)} files')
for item in changed:
    print(item)
