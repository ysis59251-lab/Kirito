let __sheet2Cache = null;
let __sheet2Promise = null;

async function loadEmbeddedSheet2Data() {
  if (__sheet2Cache) return __sheet2Cache;
  if (__sheet2Promise) return __sheet2Promise;

  __sheet2Promise = (async () => {
    if (typeof window.fetchAnimeFumeSheet !== "function") {
      throw new Error("ไม่พบตัวโหลดข้อมูล Google Sheets");
    }
    const data = await window.fetchAnimeFumeSheet("Sheet2");
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
