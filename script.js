import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
getDatabase,
ref,
onValue,
runTransaction,
set,
onDisconnect,
push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ================= FIREBASE ================= */

const firebaseConfig = {
apiKey: "AIzaSyCUxv...",
authDomain: "reader-4a13f.firebaseapp.com",
databaseURL: "https://reader-4a13f-default-rtdb.firebaseio.com",
projectId: "reader-4a13f",
storageBucket: "reader-4a13f.firebasestorage.app",
messagingSenderId: "220776049054",
appId: "1:220776049054:web:53524fb1e90ba83a12ce8f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ================= ONLINE ================= */

function initOnline(){
try{
const userRef = push(ref(db,"onlineUsers"));
set(userRef,{page:location.pathname,time:Date.now()});
onDisconnect(userRef).remove();
}catch(e){
console.error("online error",e);
}
}

/* ================= VIEW ================= */

function initViews(){
document.addEventListener("click",(e)=>{
const card = e.target.closest(".anime-card");
if(!card) return;

const id = card.dataset.id;
if(!id) return;

const viewRef = ref(db,"animeViews/"+id);

runTransaction(viewRef,(val)=>(val||0)+1);
});
}

/* ================= LOAD ================= */

function loadFromSheet(){

const url="https://opensheet.elk.sh/1zY3E1ovode0tfMAcAkX0Jk5Cwvkay_tY8cbbdRGYH58/Sheet1";

fetch(url)
.then(r=>r.json())
.then(data=>{

const container=document.getElementById("animeList");
if(!container) return;

container.innerHTML="";

data.forEach(row=>{

const card=document.createElement("div");
card.className="anime-card";

card.dataset.id=row.id||row.name;
card.dataset.title=row.name||"";
card.dataset.year=row.year||"0";
card.dataset.search="1";
card.dataset.hidden="0";

card.innerHTML=`
<img src="${row.image}" style="width:100%">
<h4>${row.name||""}</h4>
`;

container.appendChild(card);

});

sortYear();
initPagination();
initHot();

})
.catch(err=>{
console.error("โหลด sheet ไม่ได้",err);
});
}

/* ================= SEARCH ================= */

function initSearch(){
const input=document.querySelector(".search");
if(!input) return;

input.addEventListener("input",()=>{
const val=input.value.toLowerCase();

document.querySelectorAll(".anime-card").forEach(c=>{
const t=(c.dataset.title||"").toLowerCase();
c.dataset.search=t.includes(val)?"1":"0";
});

renderPage();
});
}

/* ================= SORT ================= */

function sortYear(){
const box=document.getElementById("animeList");
if(!box) return;

const cards=[...box.children];

cards.sort((a,b)=>(b.dataset.year||0)-(a.dataset.year||0));

box.innerHTML="";
cards.forEach(c=>box.appendChild(c));
}

/* ================= PAGINATION ================= */

let cards=[];
let perPage=40;
let currentPage=1;

function initPagination(){
cards=[...document.querySelectorAll(".anime-card")];
currentPage=1;
renderPage();
}

function renderPage(){

const visible=cards.filter(c=>{
return c.dataset.search!=="0" && c.dataset.hidden!=="1";
});

const total=Math.ceil(visible.length/perPage)||1;

const start=(currentPage-1)*perPage;
const end=start+perPage;

cards.forEach(c=>c.style.display="none");

visible.slice(start,end).forEach(c=>{
c.style.display="";
});

renderNumbers(total);
}

function renderNumbers(total){

const box=document.getElementById("numberBox");
if(!box) return;

box.innerHTML="";

for(let i=1;i<=total;i++){
const btn=document.createElement("div");
btn.className="num";
btn.textContent=i;

if(i===currentPage) btn.classList.add("active");

btn.onclick=()=>{
currentPage=i;
renderPage();
};

box.appendChild(btn);
}
}

/* ================= HOT ================= */

function initHot(){

const slider=document.getElementById("hotSlider");
if(!slider) return;

onValue(ref(db,"animeViews"),snap=>{

const data=snap.val();
if(!data) return;

const arr=[...document.querySelectorAll(".anime-card")].map(c=>{
return {card:c,views:data[c.dataset.id]||0};
});

arr.sort((a,b)=>b.views-a.views);

slider.innerHTML="";

arr.slice(0,6).forEach(item=>{
const clone=item.card.cloneNode(true);
clone.classList.add("hot-card");

const badge=document.createElement("div");
badge.className="hot-badge";
badge.innerText=item.views+" views";

clone.appendChild(badge);
slider.appendChild(clone);
});

});
}

/* ================= START ================= */

document.addEventListener("DOMContentLoaded",()=>{

loadFromSheet();
initOnline();
initViews();
initSearch();

});