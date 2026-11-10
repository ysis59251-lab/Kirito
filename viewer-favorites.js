(() => {
  const FAV_KEY='animefume_favorites_v2';
  const $=s=>document.querySelector(s);
  const toast=(msg)=>{const el=$('#siteToast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(window.__afToast);window.__afToast=setTimeout(()=>el.classList.remove('show'),1800)};
  const readFav=()=>{try{return JSON.parse(localStorage.getItem(FAV_KEY)||'[]')}catch{return[]}};
  const writeFav=v=>localStorage.setItem(FAV_KEY,JSON.stringify(v));
  const keyOf=x=>String(x.id||x.link||x.title||'').trim();
  function syncButtons(){document.querySelectorAll('#animeList > .anime-card').forEach(card=>{if(card.querySelector('.af-fav'))return;const title=card.dataset.title||card.querySelector('.overlay')?.textContent||'ไม่มีชื่อ';const item={id:card.dataset.id||title,title,image:card.querySelector('img')?.src||'',link:card.href,year:card.dataset.year||''};const b=document.createElement('button');b.type='button';b.className='af-fav';b.setAttribute('aria-label','เพิ่มในรายการโปรด');const active=readFav().some(x=>keyOf(x)===keyOf(item));b.textContent=active?'★':'☆';if(active)b.classList.add('active');b.onclick=e=>{e.preventDefault();e.stopPropagation();let fav=readFav();const i=fav.findIndex(x=>keyOf(x)===keyOf(item));if(i>=0){fav.splice(i,1);b.textContent='☆';b.classList.remove('active');toast('ลบออกจากรายการโปรดแล้ว')}else{fav.unshift(item);fav=fav.slice(0,100);b.textContent='★';b.classList.add('active');toast('เพิ่มในรายการโปรดแล้ว')}writeFav(fav);renderFavs()};card.appendChild(b)})}
  function renderFavs(){const grid=$('#favGrid');if(!grid)return;const fav=readFav();grid.innerHTML='';if(!fav.length){grid.innerHTML='<p style="color:#aaa;padding:25px;text-align:center;grid-column:1/-1">ยังไม่มีอนิเมะในรายการโปรด</p>';return}fav.forEach(item=>{const a=document.createElement('a');a.className='af-fav-card';a.href=item.link||'#';const img=document.createElement('img');img.src=item.image||'';img.alt=item.title||'';img.loading='lazy';const b=document.createElement('b');b.textContent=item.title||'ไม่มีชื่อ';const rm=document.createElement('button');rm.type='button';rm.className='af-remove';rm.textContent='×';rm.setAttribute('aria-label','ลบรายการโปรด');rm.onclick=e=>{e.preventDefault();e.stopPropagation();writeFav(readFav().filter(x=>keyOf(x)!==keyOf(item)));renderFavs();syncButtons();toast('ลบออกแล้ว')};a.append(img,b,rm);grid.appendChild(a)})}
  function openFav(){renderFavs();$('#afFavModal')?.classList.add('show');document.body.style.overflow='hidden'}
  function closeFav(){$('#afFavModal')?.classList.remove('show');document.body.style.overflow=''}
let sheet2Rows=[];let sheet2Filtered=[];let sheet2Page=1;const sheet2PerPage=40;
  const norm=v=>String(v??'').trim().toLowerCase();
  function sheet2Render(){
    const q=norm($('#searchInput')?.value||'');
    sheet2Filtered=sheet2Rows.filter(r=>!q||norm(r.title).includes(q)||norm(r.id).includes(q)||norm(r.year).includes(q));
    const total=Math.max(1,Math.ceil(sheet2Filtered.length/sheet2PerPage));if(sheet2Page>total)sheet2Page=total;
    const grid=$('#sheet2Grid');grid.innerHTML='';
    const start=(sheet2Page-1)*sheet2PerPage;const list=sheet2Filtered.slice(start,start+sheet2PerPage);
    if(!list.length){grid.innerHTML='<div class="sheet2-empty">ไม่พบรายการใน Sheet2</div>'}
    else list.forEach(r=>{const a=document.createElement('a');a.className='sheet2-card';a.href=r.link||'#';const wrap=document.createElement('div');wrap.className='card-img';const img=document.createElement('img');img.src=r.image||'';img.alt=r.title||'Anime';img.loading='lazy';img.decoding='async';img.onerror=()=>{img.style.opacity='.25'};const ov=document.createElement('div');ov.className='overlay';ov.textContent=r.title||'ไม่มีชื่อ';wrap.append(img,ov);const meta=document.createElement('div');meta.className='sheet2-meta';meta.textContent=[r.year,r.Show,r.id?'#'+r.id:''].filter(Boolean).join(' • ');a.append(wrap,meta);grid.appendChild(a)});
    $('#sheet2Status').textContent=`${sheet2Filtered.length.toLocaleString()} รายการ • หน้า ${sheet2Page}/${total}`;
    const pages=$('#sheet2Pages');pages.innerHTML='';const maxButtons=5;let startPage=Math.max(1,Math.min(sheet2Page-2,total-4));let endPage=Math.min(total,startPage+maxButtons-1);
    if(sheet2Page>1){const b=document.createElement('button');b.className='sheet2-page';b.textContent='‹';b.onclick=()=>{sheet2Page--;sheet2Render();document.getElementById('sheet2Section')?.scrollIntoView({behavior:'smooth',block:'start'})};pages.appendChild(b)}
    for(let i=startPage;i<=endPage;i++){const b=document.createElement('button');b.className='sheet2-page'+(i===sheet2Page?' active':'');b.textContent=i;b.onclick=()=>{sheet2Page=i;sheet2Render();document.getElementById('sheet2Section')?.scrollIntoView({behavior:'smooth',block:'start'})};pages.appendChild(b)}
    if(sheet2Page<total){const b=document.createElement('button');b.className='sheet2-page';b.textContent='›';b.onclick=()=>{sheet2Page++;sheet2Render();document.getElementById('sheet2Section')?.scrollIntoView({behavior:'smooth',block:'start'})};pages.appendChild(b)}
  }
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
  document.addEventListener('DOMContentLoaded',()=>{
    const menu=$('#menuDropdown');
    $('#openFavMenu')?.addEventListener('click',e=>{e.preventDefault();openFav();menu?.classList.remove('af-menu-open')});
    $('#afFavoritesBtn')?.addEventListener('click',openFav);$('#closeFav')?.addEventListener('click',closeFav);$('#afFavModal')?.addEventListener('click',e=>{if(e.target.id==='afFavModal')closeFav()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFav();if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();$('#searchInput')?.focus()}});
    window.addEventListener('scroll',()=>$('#backTop')?.classList.toggle('show',scrollY>500),{passive:true});$('#backTop')?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
    window.addEventListener('online',()=>toast('เชื่อมต่ออินเทอร์เน็ตแล้ว'));window.addEventListener('offline',()=>toast('ขณะนี้ออฟไลน์ ระบบบางส่วนอาจใช้ไม่ได้'));
    const list=$('#animeList');if(list){const observer=new MutationObserver(()=>{syncButtons();document.querySelectorAll('#animeList img').forEach(img=>{img.loading='lazy';img.decoding='async';if(!img.dataset.afErr){img.dataset.afErr='1';img.addEventListener('error',()=>{img.style.background='#171717';img.alt='รูปภาพไม่พร้อมใช้งาน'})}});});observer.observe(list,{childList:true,subtree:true})}
    const search=$('#searchInput');search?.addEventListener('input',()=>{sheet2Page=1;sheet2Render()});
    loadSheet2();renderFavs();
  });
})();
