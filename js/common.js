(() => {
  "use strict";

  const EVENTS = window.ZEROJURI_EVENTS || [];

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function eventSessionDate(event, session, unknownAsEndOfDay = false) {
    if (!event || !session) return null;
    if (session.start === "未定") {
      if (!unknownAsEndOfDay) return null;
      return new Date(`${event.date}T23:59:59+09:00`);
    }
    return new Date(`${event.date}T${session.start}:00+09:00`);
  }

  function knownStarts() {
    const list = [];
    EVENTS.forEach(event => {
      event.sessions.forEach(session => {
        const dt = eventSessionDate(event, session, false);
        if (!dt) return;
        const [y,m,d] = event.date.split("-").map(Number);
        const label = `${m}/${d} ${session.part ? session.part + " " : ""}${session.start}`;
        list.push({ dt, label, event, session });
      });
    });
    return list.sort((a,b) => a.dt - b.dt);
  }

  function hasFutureEventDate(now) {
    return EVENTS.some(event => {
      const end = new Date(`${event.date}T23:59:59+09:00`);
      return end.getTime() > now;
    });
  }

  function injectCommonHeader() {
    if (document.querySelector(".site-fixed-header")) return;

    const style = document.createElement("style");
    style.textContent = `
      .site-fixed-header{
        position:fixed; top:0; left:0; right:0; z-index:10020;
        height:44px;
        background:rgba(239,233,225,.72);
        border-bottom:1px solid rgba(119,105,94,.22);
        box-shadow:0 3px 14px rgba(55,45,38,.08);
        -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
      }
      .site-fixed-header-inner{
        position:relative; max-width:820px; height:100%; margin:0 auto;
      }
      .site-menu-button{
        position:absolute; right:max(12px,env(safe-area-inset-right)); top:50%;
        transform:translateY(-50%);
        width:40px; height:36px; padding:0;
        border:0; background:transparent; color:#5e554f;
        font-family:Arial,sans-serif; font-size:28px; line-height:30px;
        letter-spacing:1px; cursor:pointer;
      }
      .site-menu{
        position:absolute;
        right:max(12px,env(safe-area-inset-right)); top:39px;
        width:184px; padding:6px;
        background:rgba(250,247,242,.96);
        border:1px solid rgba(119,105,94,.28);
        box-shadow:0 8px 24px rgba(55,45,38,.16);
        -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px);
        opacity:0; visibility:hidden; transform:translateY(-5px);
        transition:opacity .18s ease,transform .18s ease,visibility .18s;
      }
      .site-menu.is-open{opacity:1;visibility:visible;transform:translateY(0)}
      .site-menu a{
        display:block; padding:11px 12px; color:#5b524c; text-decoration:none;
        font-size:11px; letter-spacing:.05em; border-bottom:1px solid rgba(119,105,94,.12);
      }
      .site-menu a:last-child{border-bottom:0}
      .site-menu a[aria-current="page"]{
        background:rgba(222,214,204,.58); font-weight:700;
      }
      .site-menu a.is-disabled{
        opacity:.38;
        pointer-events:none;
        cursor:default;
      }
      @media(max-width:560px){
        .site-fixed-header{height:40px}
        .site-menu-button{right:max(8px,env(safe-area-inset-right));width:38px;height:34px;font-size:26px}
        .site-menu{right:max(8px,env(safe-area-inset-right));top:36px;width:172px}
      }
    `;
    document.head.appendChild(style);

    const page = document.body.dataset.page || "";
    const header = document.createElement("div");
    header.className = "site-fixed-header";
    header.innerHTML = `
      <div class="site-fixed-header-inner">
        <button class="site-menu-button" type="button" aria-label="メニューを開く" aria-expanded="false">⋯</button>
        <nav class="site-menu" aria-label="サイトメニュー">
          <a href="index.html"${page === "schedule" ? ' aria-current="page"' : ""}>スケジュール</a>
          <a class="is-disabled" aria-disabled="true" tabindex="-1">特典内容早見表</a>
        </nav>
      </div>`;
    document.body.prepend(header);

    const button = header.querySelector(".site-menu-button");
    const menu = header.querySelector(".site-menu");
    const close = () => {
      menu.classList.remove("is-open");
      button.setAttribute("aria-expanded","false");
      button.setAttribute("aria-label","メニューを開く");
    };
    button.addEventListener("click", e => {
      e.stopPropagation();
      const open = !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    menu.addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  function initCountdown() {
    const root = document.getElementById("fixedZerojuriCountdown");
    if (!root) return;

    const nums = ["fcdD","fcdH","fcdM","fcdS"].map(id => document.getElementById(id));
    const nextEl = document.getElementById("fcdNext");
    const starts = knownStarts();
    const pad = n => String(n).padStart(2,"0");

    function tick() {
      const now = Date.now();
      const next = starts.find(x => x.dt.getTime() > now);

      if (!next) {
        root.classList.add("is-tbd");
        nextEl.textContent = hasFutureEventDate(now)
          ? "次回のSTART時刻は詳細発表をお待ちください"
          : "次回の開催情報は公式案内をご確認ください";
        return;
      }

      root.classList.remove("is-tbd");
      let s = Math.max(0, Math.floor((next.dt.getTime() - now) / 1000));
      const d = Math.floor(s/86400); s %= 86400;
      const h = Math.floor(s/3600); s %= 3600;
      const m = Math.floor(s/60); s %= 60;
      [d,h,m,s].forEach((v,i) => { if (nums[i]) nums[i].textContent = pad(v); });
      nextEl.textContent = "NEXT " + next.label;
    }

    tick();
    setInterval(tick, 1000);
  }

  function renderSchedule() {
    const list = document.getElementById("scheduleList");
    if (!list) return;

    const sorted = [...EVENTS].sort((a,b) => a.date.localeCompare(b.date));

    list.innerHTML = sorted.map((event, index) => {
      const [year,month,day] = event.date.split("-").map(Number);
      const sessions = event.sessions.map(session => `
        <div class="session">
          ${session.part ? `<span class="part-text">${esc(session.part)}</span>` : ""}
          <b>START ${esc(session.start)}</b>
          <span>/ 集合 ${esc(session.meeting)}</span>
        </div>`).join("");

      const inner = `
        <div class="datebox">
          <small>${year}.</small>
          <strong>${month}.${day}</strong>
          <em class="w-${esc(event.weekday.charAt(0))}">${esc(event.weekday)}</em>
        </div>
        <div class="body">
          ${sessions}
          <div class="meta">
            <div><label>場所</label><p>${esc(event.place)}</p></div>
            <div class="sale"><label>販売</label><p>${esc(event.sales)}</p></div>
          </div>
        </div>`;

      return event.url
        ? `<a id="event-${index}" class="card" data-index="${index}" href="${esc(event.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
        : `<div id="event-${index}" class="card" data-index="${index}">${inner}</div>`;
    }).join("");

    const cards = [...list.querySelectorAll(".card")];
    const now = new Date();
    let nextIndex = -1;

    sorted.forEach((event, i) => {
      let hasFuture = false;
      let allPast = true;

      event.sessions.forEach(session => {
        const dt = eventSessionDate(event, session, true);
        if (dt && dt >= now) {
          hasFuture = true;
          allPast = false;
        }
      });

      if (allPast) cards[i]?.classList.add("past");
      if (nextIndex === -1 && hasFuture) nextIndex = i;
    });

    if (nextIndex >= 0 && cards[nextIndex]) {
      const target = cards[nextIndex];
      target.classList.add("next");

      window.addEventListener("load", () => {
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";
        window.scrollTo(0,0);
        setTimeout(() => {
          const rect = target.getBoundingClientRect();
          const targetTop = rect.top + window.pageYOffset - (window.innerHeight/2) + (rect.height/2);
          window.scrollTo({top:Math.max(0,targetTop),behavior:"smooth"});
        }, 800);
      }, {once:true});
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectCommonHeader();
    renderSchedule();
    initCountdown();
  });
})();
