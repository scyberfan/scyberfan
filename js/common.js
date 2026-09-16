(() => {
"use strict";
const EVENTS=window.ZEROJURI_EVENTS||[];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function injectHeader(){
 if(document.querySelector(".site-fixed-header"))return;
 const style=document.createElement("style");
 style.textContent=`
 .site-fixed-header{position:fixed;top:0;left:0;right:0;z-index:10020;height:46px;background:rgba(242,236,229,.86);border-bottom:1px solid rgba(112,96,84,.34);box-shadow:0 4px 18px rgba(55,45,38,.12);-webkit-backdrop-filter:blur(11px) saturate(115%);backdrop-filter:blur(11px) saturate(115%)}
 .site-fixed-header:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(112,96,84,.34),transparent)}
 .site-fixed-header-inner{position:relative;max-width:820px;height:100%;margin:auto}
 .site-menu-button{position:absolute;right:max(12px,env(safe-area-inset-right));top:50%;transform:translateY(-50%);width:38px;height:34px;padding:0;border:1px solid rgba(112,96,84,.27);border-radius:50%;background:rgba(255,252,248,.54);box-shadow:0 2px 9px rgba(55,45,38,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:.22s ease}
 .site-menu-button:active{transform:translateY(-50%) scale(.94)}
 .site-menu-icon{position:relative;width:17px;height:13px;display:block}
 .site-menu-icon span{position:absolute;left:0;width:17px;height:1.5px;border-radius:999px;background:#675d56;transform-origin:center;transition:top .24s ease,transform .24s ease,opacity .18s ease}
 .site-menu-icon span:nth-child(1){top:0}.site-menu-icon span:nth-child(2){top:5.75px}.site-menu-icon span:nth-child(3){top:11.5px}
 .site-menu-button.is-open{background:rgba(255,252,248,.82);border-color:rgba(112,96,84,.42)}
 .site-menu-button.is-open .site-menu-icon span:nth-child(1){top:5.75px;transform:rotate(45deg)}
 .site-menu-button.is-open .site-menu-icon span:nth-child(2){opacity:0}
 .site-menu-button.is-open .site-menu-icon span:nth-child(3){top:5.75px;transform:rotate(-45deg)}
 .site-menu{position:absolute;right:max(12px,env(safe-area-inset-right));top:48px;width:184px;padding:6px;border-radius:12px;background:rgba(250,247,242,.97);border:1px solid rgba(119,105,94,.28);box-shadow:0 10px 28px rgba(55,45,38,.17);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);opacity:0;visibility:hidden;transform:translateY(-5px) scale(.98);transform-origin:top right;transition:.18s ease}
 .site-menu.is-open{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
 .site-menu a{display:block;padding:11px 12px;color:#5b524c;text-decoration:none;font-size:11px;letter-spacing:.05em;border-radius:8px;box-shadow:none;border-bottom:none}
 .site-menu a:last-child{border-bottom:0}.site-menu a[aria-current="page"]{background:rgba(222,214,204,.58);font-weight:700}
 .site-menu a.is-disabled{opacity:.38;pointer-events:none;cursor:default}
 @media(max-width:560px){.site-fixed-header{height:42px}.site-menu-button{right:max(9px,env(safe-area-inset-right));width:36px;height:32px}.site-menu{right:max(9px,env(safe-area-inset-right));top:44px;width:172px}}`;
 document.head.appendChild(style);
 const page=document.body.dataset.page||"";
 const h=document.createElement("div");h.className="site-fixed-header";
 h.innerHTML=`<div class="site-fixed-header-inner"><button class="site-menu-button" type="button" aria-label="メニューを開く" aria-expanded="false"><span class="site-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span></button><nav class="site-menu" aria-label="サイトメニュー"><a href="index.html"${page==="schedule"?' aria-current="page"':""}>スケジュール</a><a href="benefits.html"${page==="benefits"?' aria-current="page"':""}>特典内容早見表</a></nav></div>`;
 document.body.prepend(h);
 const b=h.querySelector(".site-menu-button"),m=h.querySelector(".site-menu");
 const close=()=>{m.classList.remove("is-open");b.classList.remove("is-open");b.setAttribute("aria-expanded","false");b.setAttribute("aria-label","メニューを開く")};
 b.addEventListener("click",e=>{e.stopPropagation();const o=!m.classList.contains("is-open");m.classList.toggle("is-open",o);b.classList.toggle("is-open",o);b.setAttribute("aria-expanded",String(o));b.setAttribute("aria-label",o?"メニューを閉じる":"メニューを開く")});
 m.addEventListener("click",e=>e.stopPropagation());document.addEventListener("click",close);document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
}


function renderSchedule(){
  const list=document.getElementById("scheduleList");
  if(!list)return;

  const now=new Date();
  let nextIndex=-1;
  for(let i=0;i<EVENTS.length;i++){
    const e=EVENTS[i];
    const valid=(e.sessions||[]).filter(x=>x.start && x.start!=="未定");
    if(!valid.length) continue;
    const last=valid.map(x=>new Date(`${e.date}T${x.start}:00+09:00`)).sort((a,b)=>b-a)[0];
    if(last>=now){nextIndex=i;break;}
  }

  list.innerHTML=EVENTS.map((e,i)=>{
    const [y,m,d]=e.date.split("-");
    const valid=(e.sessions||[]).filter(x=>x.start && x.start!=="未定");
    const last=valid.length?valid.map(x=>new Date(`${e.date}T${x.start}:00+09:00`)).sort((a,b)=>b-a)[0]:null;
    const past=last && last<now;
    const classes=["card",past?"past":"",i===nextIndex?"next":""].filter(Boolean).join(" ");
    const sessions=(e.sessions||[]).map(x=>`
      <div class="session">
        ${x.part?`<span class="part-text">${esc(x.part)}</span>`:""}
        <b>START ${esc(x.start||"未定")}</b>
        <span>/ 集合 ${esc(x.meeting||"未定")}</span>
      </div>`).join("");
    const content=`
      <div class="datebox"><small>${esc(y)}.</small><strong>${Number(m)}.${Number(d)}</strong><em class="w-${esc(e.weekday)}">${esc(e.weekday)}</em></div>
      <div class="body">${sessions}<div class="meta">
        <div><label>場所</label><p>${esc(e.place||"未定")}</p></div>
        <div class="sale"><label>販売</label><p>${esc(e.sales||"未定")}</p></div>
      </div></div>`;
    return e.url
      ? `<a class="${classes}" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${content}</a>`
      : `<div class="${classes}">${content}</div>`;
  }).join("");

  /* index.html表示時は毎回、トップを見せてから次回公演を中央へスクロール */
  const next=list.querySelector(".card.next");
  if(next){
    setTimeout(()=>next.scrollIntoView({behavior:"smooth",block:"center"}),450);
  }
}

function starts(){const a=[];EVENTS.forEach(e=>e.sessions.forEach(x=>{if(x.start!=="未定"){const d=new Date(`${e.date}T${x.start}:00+09:00`);const [,m,day]=e.date.split("-").map(Number);a.push({d,label:`${m}/${day} ${x.part?x.part+" ":""}${x.start}`})}}));return a.sort((a,b)=>a.d-b.d)}
function countdown(){const root=document.getElementById("fixedZerojuriCountdown");if(!root)return;const nums=["fcdD","fcdH","fcdM","fcdS"].map(id=>document.getElementById(id)),next=document.getElementById("fcdNext"),list=starts(),pad=n=>String(n).padStart(2,"0");function tick(){const now=Date.now(),n=list.find(x=>x.d.getTime()>now);if(!n){if(next)next.textContent="次回の開催情報は公式案内をご確認ください";return}let s=Math.max(0,Math.floor((n.d-now)/1000)),d=Math.floor(s/86400);s%=86400;let h=Math.floor(s/3600);s%=3600;let m=Math.floor(s/60);s%=60;[d,h,m,s].forEach((v,i)=>nums[i]&&(nums[i].textContent=pad(v)));if(next)next.textContent="NEXT "+n.label}tick();setInterval(tick,1000)}

document.addEventListener("DOMContentLoaded",()=>{injectHeader();renderSchedule();countdown()});
})();