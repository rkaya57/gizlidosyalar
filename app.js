const $ = (sel) => document.querySelector(sel);

function nowClock(){
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  $("#clock").textContent = `${hh}:${mm}`;
}
setInterval(nowClock, 1000);
nowClock();

function logLine(line){
  const box = $("#sysLog");
  box.textContent += `\n${line}`;
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

// Sabit personel bilgisi
const PERSONNEL = {
  name: "Şaban Başkök",
  job: "Özel Güvenlik Görevlisi",
  loc: "Sinop / Erfelek",
};

// Demo giriş bilgisi (istersen değiştir)
const AUTH = {
  username: "personel",
  password: "1234",
};

// Sesli bot metni
const BOT_TEXT = `${PERSONNEL.name}, konum ${PERSONNEL.loc.replace(" / ", " ")}, ${PERSONNEL.job}. Lütfen giriş bilgilerinizi giriniz.`;

function speakTR(text){
  if(!("speechSynthesis" in window)){
    logLine("[WARN] SpeechSynthesis desteklenmiyor.");
    return;
  }
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const trVoices = voices.filter(v => (v.lang || "").toLowerCase().startsWith("tr"));
  if(trVoices.length) utter.voice = trVoices[0];
  utter.lang = trVoices.length ? trVoices[0].lang : "tr-TR";

  utter.onstart = () => logLine("[VOICE] agent speaking…");
  utter.onend   = () => logLine("[VOICE] done.");
  utter.onerror = () => logLine("[ERR] voice error.");

  window.speechSynthesis.speak(utter);
}

if("speechSynthesis" in window){
  window.speechSynthesis.onvoiceschanged = () => {
    logLine(`[AUDIT] voices loaded: ${window.speechSynthesis.getVoices().length}`);
  };
}

// Views
const loginView = $("#loginView");
const dashView  = $("#dashView");

function showLogin(){
  dashView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

function showDash(){
  loginView.classList.add("hidden");
  dashView.classList.remove("hidden");

  $("#userChip").textContent = `${PERSONNEL.name} / ${PERSONNEL.job} / ${PERSONNEL.loc}`;
  renderDossiers();
}

// PDF listesi (files.js içinden gelir)
function getDossiers(){
  const arr = window.DOSSIERS || [];
  return Array.isArray(arr) ? arr : [];
}

function renderDossiers(){
  const list = $("#fileList");
  list.innerHTML = "";

  const dossiers = getDossiers();
  if(dossiers.length === 0){
    const empty = document.createElement("div");
    empty.className = "fileItem";
    empty.style.cursor = "default";
    empty.innerHTML = `
      <div class="fileName">Hiç PDF tanımlanmamış</div>
      <div class="fileMeta">files.js içine DOSSIERS listesi ekleyin.</div>
    `;
    list.appendChild(empty);
    return;
  }

  dossiers.forEach((d, idx) => {
    const item = document.createElement("div");
    item.className = "fileItem";
    item.innerHTML = `
      <div class="fileName">#${String(idx+1).padStart(2,'0')} — ${escapeHtml(d.title || "Untitled")}</div>
      <div class="fileMeta">${escapeHtml(d.tag || "CONFIDENTIAL")} • ${escapeHtml(d.date || "")}</div>
    `;
    item.addEventListener("click", () => openPdf(d));
    list.appendChild(item);
  });
}

function openPdf(d){
  $("#viewerMeta").innerHTML = `<span class="badge">DOSYA</span><span>${escapeHtml(d.title || "")}</span>`;
  $("#pdfFrame").src = d.path;
  logLine(`[OPEN] ${d.path}`);
}

// Login actions
$("#speakBtn").addEventListener("click", () => speakTR(BOT_TEXT));

$("#loginBtn").addEventListener("click", () => {
  const u = $("#username").value.trim();
  const p = $("#password").value;

  if(u === AUTH.username && p === AUTH.password){
    localStorage.setItem("session_ok", "1");
    logLine(`[AUTH] granted: ${u}`);
    showDash();
  } else {
    logLine(`[DENY] invalid credentials: ${u || "?"}`);
    alert("Kullanıcı adı veya şifre hatalı.");
  }
});

$("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("session_ok");
  $("#pdfFrame").src = "";
  $("#viewerMeta").innerHTML = `<span class="badge">DOSYA</span><span class="muted">Bir PDF seçiniz…</span>`;
  logLine("[AUTH] session cleared.");
  showLogin();
});

// Boot
function boot(){
  // Personel alanları sabit
  $("#pName").textContent = PERSONNEL.name;
  $("#pJob").textContent  = PERSONNEL.job;
  $("#pLoc").textContent  = PERSONNEL.loc;

  const ok = localStorage.getItem("session_ok") === "1";
  if(ok){
    logLine("[BOOT] session found. redirecting…");
    showDash();
  } else {
    showLogin();
    // Otomatik ses (bazı tarayıcılar ilk etkileşim ister)
    setTimeout(() => speakTR(BOT_TEXT), 350);
  }
}
boot();
