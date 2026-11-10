/* AnimeFume Sheet2 loader.
   Dataset is fetched at runtime instead of embedding a reversible GZIP payload.
   NOTE: the OpenSheet endpoint remains public; do not store private data here. */
const SHEET2_REMOTE_URL = "https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet2";
let __sheet2Cache = null;
let __sheet2Promise = null;

async function loadEmbeddedSheet2Data() {
  if (__sheet2Cache) return __sheet2Cache;
  if (__sheet2Promise) return __sheet2Promise;

  __sheet2Promise = (async () => {
    const response = await fetch(SHEET2_REMOTE_URL, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("โหลดข้อมูล Sheet2 ไม่สำเร็จ (" + response.status + ")");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("รูปแบบข้อมูล Sheet2 ไม่ถูกต้อง");
    __sheet2Cache = data;
    window.AnimeFumeData = window.AnimeFumeData || {};
    window.AnimeFumeData.sheet2 = data;
    return data;
  })();

  try {
    return await __sheet2Promise;
  } finally {
    __sheet2Promise = null;
  }
}

window.loadEmbeddedSheet2Data = loadEmbeddedSheet2Data;
window.AnimeFumeData = window.AnimeFumeData || {};
window.AnimeFumeData.loadSheet2 = loadEmbeddedSheet2Data;
