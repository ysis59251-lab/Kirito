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

/* ================= ONLINE USERS ================= */

function initOnline(){

const userRef = push(ref(db,"onlineUsers"));

set(userRef,{
page: location.pathname,
time: Date.now()
});

onDisconnect(userRef).remove();

}

/* ================= VIEW COUNTER ================= */

function initViews(){

const today = new Date().toISOString().slice(0,10);
const key = "view-"+today;

if(!localStorage.getItem(key)){

localStorage.setItem(key,"1");

runTransaction(ref(db,"stats/total"),v=>(v||0)+1);
runTransaction(ref(db,"stats/daily/"+today),v=>(v||0)+1);

}

document.querySelectorAll(".anime-card").forEach(card=>{

const id = card.dataset.id;

card.addEventListener("click",()=>{

runTransaction(
ref(db,"animeViews/"+id),
v=>(v||0)+1
);

});

});

}

/* ================= SEARCH ================= */

function initSearch(){

const input=document.querySelector(".search");

if(!input) return;

input.addEventListener("input",()=>{

const value=input.value.toLowerCase();

document.querySelectorAll(".anime-card").forEach(card=>{

const title=(card.dataset.title||"").toLowerCase();

card.dataset.search = title.includes(value) ? "1":"0";

});

refreshPagination();

});

}

/* ================= ADMIN HIDE ================= */

function initAdmin(){

onValue(ref(db,"animeList"),snap=>{

document.querySelectorAll(".anime-card").forEach(card=>{

const id=card.dataset.id;

const data=snap.child(id).val();

card.dataset.hidden =
(data && data.hidden)
? "1":"0";

});

refreshPagination();

});

}

/* ================= SORT YEAR ================= */

function sortYear(){

const box=document.getElementById("animeList");
if(!box) return;

const cards=[...box.querySelectorAll(".anime-card")];

cards.sort((a,b)=>{

return (b.dataset.year||0)-(a.dataset.year||0);

});

box.innerHTML="";

cards.forEach(c=>box.appendChild(c));

}

/* ================= PAGINATION ================= */

let cards=[];
let perPage=40;
let currentPage=1;

function initPagination(){

cards=[...document.querySelectorAll(".anime-card")];

currentPage=parseInt(localStorage.getItem("animePage"))||1;

renderPage();

}

function renderPage(){

const visible = cards.filter(card=>{

return card.dataset.hidden!=="1" &&
card.dataset.search!=="0";

});

const total=Math.ceil(visible.length/perPage) || 1;

if(currentPage>total) currentPage=1;

const start=(currentPage-1)*perPage;
const end=start+perPage;

cards.forEach(card=>card.style.display="none");

visible.slice(start,end).forEach(card=>{
card.style.display="";
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

if(i===currentPage){
btn.classList.add("active");
}

btn.onclick=()=>{

currentPage=i;

localStorage.setItem("animePage",i);

renderPage();

};

box.appendChild(btn);

}

}

window.refreshPagination=()=>{
renderPage();
};

/* ================= HOT ANIME ================= */

function initHot(){

const slider=document.getElementById("hotSlider");

if(!slider) return;

onValue(ref(db,"animeViews"),snap=>{

const data=snap.val();

if(!data) return;

const arr=[...document.querySelectorAll(".anime-card")].map(card=>{

const id=card.dataset.id;

return{
card,
views:data[id]||0
};

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

/* ================= MENU ================= */

const menuBtn=document.getElementById("menuBtn");
const menu=document.getElementById("menuDropdown");

if(menuBtn){
menuBtn.onclick=()=>{
menu.style.display =
menu.style.display==="flex"
?"none":"flex";
};
}

/* ================= FOOTER ================= */

const year=document.getElementById("year");

if(year){
year.textContent = new Date().getFullYear();
}

/* ================= BOTTOM NAV ================= */

function toggleBottom(){

const box=document.getElementById("bottomNav");

if(box) box.classList.toggle("show");

}

window.toggleBottom=toggleBottom;

window.nextSet=()=>{

currentPage++;

localStorage.setItem("animePage",currentPage);

renderPage();

};

window.prevSet=()=>{

currentPage--;

if(currentPage<1) currentPage=1;

localStorage.setItem("animePage",currentPage);

renderPage();

};

/* ================= START ================= */

document.addEventListener("DOMContentLoaded",()=>{

document.querySelectorAll(".anime-card").forEach(card=>{

card.dataset.search="1";
card.dataset.hidden="0";

});

initOnline();
initViews();
initSearch();
initAdmin();
sortYear();
initHot();

setTimeout(()=>{
initPagination();
},200);

});