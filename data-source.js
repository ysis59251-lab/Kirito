(() => {
  'use strict';

  const SPREADSHEET_ID = '1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58';
  const AVAILABLE_PLAYER_IDS = new Set([202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,431,601,602,603,604]);
  const cache = new Map();
  const pending = new Map();

  function gvizUrl(sheet) {
    return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;
  }

  function parseGviz(text) {
    const start = text.indexOf('setResponse(');
    if (start < 0) throw new Error('รูปแบบข้อมูล Google Sheets ไม่ถูกต้อง');
    const jsonText = text.slice(start + 'setResponse('.length).replace(/\);?\s*$/, '');
    const payload = JSON.parse(jsonText);
    if (payload.status !== 'ok' || !payload.table) {
      throw new Error(payload.errors?.[0]?.detailed_message || 'Google Sheets ส่งข้อมูลไม่สำเร็จ');
    }
    const columns = payload.table.cols.map((column, index) => column.label || column.id || `column${index}`);
    return (payload.table.rows || []).map((row) => {
      const item = {};
      columns.forEach((name, index) => {
        const cell = row.c?.[index];
        item[name] = cell?.v ?? '';
      });
      return item;
    });
  }

  async function fetchSheet(sheet) {
    const key = String(sheet || 'Sheet1');
    if (cache.has(key)) return cache.get(key);
    if (pending.has(key)) return pending.get(key);
    const request = (async () => {
      try {
        const urls = [];
        if (location.protocol === 'http:' || location.protocol === 'https:') {
          urls.push(`/api/sheet?name=${encodeURIComponent(key)}`);
        }
        urls.push(gvizUrl(key));
        let lastError;
        let rows;
        for (const url of urls) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15000);
          try {
            const response = await fetch(url, {
              cache: 'no-store',
              headers: { Accept: 'text/plain, application/javascript' },
              signal: controller.signal
            });
            if (!response.ok) throw new Error(`Google Sheets HTTP ${response.status}`);
            rows = parseGviz(await response.text());
            break;
          } catch (error) {
            lastError = error;
          } finally {
            clearTimeout(timer);
          }
        }
        if (!rows) throw lastError || new Error('ไม่สามารถโหลดข้อมูลได้');
        const usableRows = rows.filter((row) => {
          const id = String(row.id ?? '').replace(/\.0$/, '');
          const link = String(row.link ?? '').trim();
          const match = link.match(/folder-name\/?(\d+)\.html$/i);
          const playerId = match ? match[1] : id;
          return !playerId || AVAILABLE_PLAYER_IDS.has(Number(playerId));
        });
        if (usableRows.length !== rows.length) {
          console.warn(`[AnimeFume] ซ่อนรายการที่ไม่มีหน้า player: ${rows.length - usableRows.length} รายการ`);
        }
        cache.set(key, usableRows);
        return usableRows;
      } finally {
        pending.delete(key);
      }
    })();
    pending.set(key, request);
    return request;
  }

  window.fetchAnimeFumeSheet = fetchSheet;
  window.AnimeFumeData = window.AnimeFumeData || {};
  window.AnimeFumeData.fetchSheet = fetchSheet;
})();
