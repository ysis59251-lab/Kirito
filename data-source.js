(() => {
  'use strict';

  const SPREADSHEET_ID = '1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58';
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
        cache.set(key, rows);
        return rows;
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
