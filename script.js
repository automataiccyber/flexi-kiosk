// --- Storage Helper (Firebase-only, no local storage) ---
function getData() { return {}; }
function saveData(_) { /* no-op: use Firestore only */ }

function getFirestoreDB() {
  try {
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
      console.error('FIREBASE_CONFIG missing');
      return null;
    }
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      return null;
    }
    if (!window._firebaseApp) {
      window._firebaseApp = firebase.initializeApp(window.FIREBASE_CONFIG);
      try {
        if (firebase.appCheck && window.FIREBASE_RECAPTCHA_KEY) {
          firebase.appCheck().activate(window.FIREBASE_RECAPTCHA_KEY, true);
        }
      } catch (e) { console.warn('AppCheck init error', e); }
      window._db = firebase.firestore();
      try {
        window._db.settings({ experimentalForceLongPolling: true, ignoreUndefinedProperties: true });
      } catch (e) { console.warn('Firestore settings error', e); }
    }
    return window._db || null;
  } catch (e) {
    console.error('getFirestoreDB error', e);
    return null;
  }
}

async function checkFirestoreConnectivity() {
  try {
    const db = getFirestoreDB();
    if (!db) return { ok: false, error: 'no-db' };
    // Check connection by reading announcements (read-only check)
    await db.collection('announcements').limit(1).get();
    return { ok: true };
  } catch (e) {
    console.error('Connectivity check failed:', e);
    return { ok: false, error: (e && e.code) || (e && e.message) || 'error' };
  }
}

function updateDbIndicator(text, ok) {
  const el = document.getElementById('db-indicator');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#2f855a' : '#c53030';
}

async function logInfo(type, details) {
  try {
    const db = getFirestoreDB();
    const doc = { type, details, ts: new Date().toISOString(), ua: (navigator && navigator.userAgent) || '' };
    if (db) { try { await db.collection('logs').add(doc); } catch {} }
  } catch {}
}


async function fetchAnnouncements(limitCount = 3) {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const snap = await db.collection('announcements').orderBy('createdAt', 'desc').limit(limitCount).get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!rows || rows.length === 0) throw new Error('empty');
    return rows;
  } catch (e) {
    if (e.message !== 'empty') console.error('fetchAnnouncements error:', e);
    return [];
  }
}

async function addAnnouncement(title, date, time) {
  const db = getFirestoreDB();
  const doc = { title, date, time, createdAt: new Date().toISOString() };
  if (db) {
    try { await db.collection('announcements').add(doc); } catch {}
  }
  await logInfo('announcement_add', { title, date, time });
}

async function deleteAnnouncement(id) {
  try {
    const db = getFirestoreDB();
    if (!db) return;
    await db.collection('announcements').doc(id).delete();
    await logInfo('announcement_delete', { id });
  } catch {}
}

async function pinAnnouncement(id, pinned = true) {
  try {
    const db = getFirestoreDB();
    if (!db) return;
    if (pinned) {
      const snap = await db.collection('announcements').where('pinned', '==', true).get();
      const unpins = snap.docs
        .filter(d => d.id !== id)
        .map(d => db.collection('announcements').doc(d.id).update({ pinned: false }));
      try { await Promise.all(unpins); } catch {}
    }
    await db.collection('announcements').doc(id).update({ pinned: !!pinned });
    await logInfo('announcement_pin', { id, pinned });
  } catch {}
}

async function fetchEvents(limitCount = 1) {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const snap = await db.collection('events').orderBy('createdAt', 'desc').limit(limitCount).get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!rows || rows.length === 0) throw new Error('empty');
    return rows;
  } catch (e) {
    if (e.message !== 'empty') console.error('fetchEvents error:', e);
    return [];
  }
}

async function deleteEvent(id) {
  try {
    const db = getFirestoreDB();
    if (!db) return;
    await db.collection('events').doc(id).delete();
    await logInfo('event_delete', { id });
  } catch {}
}

async function addEvent(title, date, image) {
  const db = getFirestoreDB();
  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const doc = { title, date: displayDate, image, createdAt: new Date().toISOString() };
  if (db) {
    try { await db.collection('events').add(doc); } catch {}
  }
  await logInfo('event_add', { title, date: displayDate });
}

async function fetchHighlights(limitCount = 5) {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const snap = await db.collection('highlights').orderBy('createdAt', 'desc').limit(limitCount).get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!rows || rows.length === 0) throw new Error('empty');
    return rows;
  } catch {
    return [];
  }
}

async function addHighlight(image) {
  const db = getFirestoreDB();
  const doc = { image, createdAt: new Date().toISOString() };
  if (db) {
    try { await db.collection('highlights').add(doc); } catch {}
  }
  await logInfo('highlight_add', {});
}

async function deleteHighlight(id) {
  try {
    const db = getFirestoreDB();
    if (!db) return;
    await db.collection('highlights').doc(id).delete();
    await logInfo('highlight_delete', { id });
  } catch {}
}

async function replaceHighlight(id, image) {
  try {
    const db = getFirestoreDB();
    if (!db) return;
    await db.collection('highlights').doc(id).update({ image, updatedAt: new Date().toISOString() });
    await logInfo('highlight_replace', { id });
  } catch {}
}

async function fetchSchedules(limitCount = 2) {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const snap = await db.collection('schedules').orderBy('createdAt', 'desc').limit(limitCount).get();
    const rows = snap.docs.map(d => d.data());
    if (!rows || rows.length === 0) throw new Error('empty');
    return rows;
  } catch {
    return [];
  }
}

async function fetchTeachers(limitCount = 8) {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const snap = await db.collection('teachers').orderBy('createdAt', 'desc').limit(limitCount).get();
    const rows = snap.docs.map(d => d.data());
    if (!rows || rows.length === 0) throw new Error('empty');
    return rows;
  } catch {
    return [];
  }
}

function to12h(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

async function addSchedule(title, start, end) {
  const db = getFirestoreDB();
  const time = `${to12h(start)} - ${to12h(end)}`;
  if (!db) {
    alert('Firestore not connected');
    return;
  }
  await db.collection('schedules').add({ title, time, createdAt: new Date().toISOString() });
  await logInfo('schedule_add', { title, time });
}

async function addTeacher(name, availability) {
  const db = getFirestoreDB();
  const doc = { name, availability, createdAt: new Date().toISOString() };
  if (db) {
    try { await db.collection('teachers').add(doc); } catch {}
  }
  await logInfo('teacher_add', { name, availability });
}

async function saveConfigDocs(payload) {
  const db = getFirestoreDB();
  if (db) {
    try {
      if (payload.ticker !== undefined) await db.collection('config').doc('ticker').set({ text: payload.ticker });
      if (payload.media !== undefined) await db.collection('config').doc('media').set(payload.media);
      if (payload.officeInfo !== undefined) await db.collection('config').doc('officeInfo').set(payload.officeInfo);
      if (payload.facilityStatus !== undefined) await db.collection('config').doc('facilityStatus').set(payload.facilityStatus);
    } catch {}
  }
  await logInfo('config_save', { keys: Object.keys(payload) });
}

async function addRoom(name, status) {
  const db = getFirestoreDB();
  if (!db) {
    await logInfo('room_add', { name, status });
    return;
  }
  await db.collection('rooms').add({ name, status, createdAt: new Date().toISOString() });
  await logInfo('room_add', { name, status });
}

async function clearDatabase() {
  const db = getFirestoreDB();
  if (!db) { alert('Database not configured'); return; }
  const colls = ['announcements','events','schedules','teachers','rooms'];
  for (const c of colls) {
    try {
      const snap = await db.collection(c).get();
      for (const d of snap.docs) {
        try { await d.ref.delete(); } catch {}
      }
    } catch {}
  }
  try { await db.collection('config').doc('ticker').delete(); } catch {}
  try { await db.collection('config').doc('media').delete(); } catch {}
  try { await db.collection('config').doc('officeInfo').delete(); } catch {}
  try { await db.collection('config').doc('facilityStatus').delete(); } catch {}
  try { localStorage.removeItem('flexiData'); } catch {}
  await logInfo('db_clear', {});
  alert('Database cleaned');
}

async function fetchRooms() {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const snap = await db.collection('rooms').orderBy('createdAt', 'desc').get();
    const rows = snap.docs.map(d => d.data());
    if (!rows || rows.length === 0) throw new Error('empty');
    return rows;
  } catch {
    return [];
  }
}

async function fetchConfig(name) {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const doc = await db.collection('config').doc(name).get();
    if (!doc.exists) throw new Error('empty');
    return doc.data();
  } catch {
    return null;
  }
}

async function fileToDataURL(file) {
  if (!file) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function compressImageToDataURL(file, maxWidth = 800, quality = 0.7) {
  if (!file) return null;
  const dataUrl = await fileToDataURL(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

// --- Time & Date ---
function updateTime() {
  const now = new Date();
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');
  
  if (timeEl && dateEl) {
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
}

function showOverlay(title, html) {
  const overlay = document.getElementById('voice-overlay');
  const t = document.getElementById('voice-title');
  const c = document.getElementById('voice-content');
  if (!overlay || !t || !c) return;
  t.textContent = title;
  c.innerHTML = html;
  overlay.style.display = 'flex';
  clearTimeout(window._voiceHideTimer);
  window._voiceHideTimer = setTimeout(() => { overlay.style.display = 'none'; }, 12000);
}

function hideOverlay() {
  const overlay = document.getElementById('voice-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showPowerOff() {
  const el = document.getElementById('power-overlay');
  if (el) el.style.display = 'block';
  try { console.log('Power OFF overlay shown'); } catch {}
}

function hidePowerOff() {
  const el = document.getElementById('power-overlay');
  if (el) el.style.display = 'none';
  try { console.log('Power OFF overlay hidden'); } catch {}
}

function showModal(title, html) {
  const overlay = document.getElementById('modal-overlay');
  const t = document.getElementById('modal-title');
  const c = document.getElementById('modal-content');
  if (!overlay || !t || !c) return;
  // Clear paging state by default
  window._modalPager = null;
  const headerRow = t.parentElement;
  if (headerRow) { headerRow.style.display = 'flex'; headerRow.style.flex = '0 0 10%'; }
  const closeBtn = document.getElementById('modal-close');
  const lower = String(title || '').toLowerCase();
  const noClose = (lower === 'help' || lower === 'calendar' || lower === 'highlights');
  if (closeBtn) closeBtn.style.display = noClose ? 'none' : 'inline-block';
  if (lower === 'help') { c.style.overflow = 'hidden'; c.style.minHeight = '0'; }
  else if (lower === 'calendar' || lower === 'schedule') { c.style.overflow = 'hidden'; c.style.minHeight = '0'; }
  else { c.style.overflow = 'auto'; c.style.minHeight = '0'; }
  t.textContent = (title || '').toUpperCase();
  c.innerHTML = html;
  overlay.style.display = 'flex';
  window._lastModal = { title, html };
}

function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'none';
  window._modalPager = null;
  if (window._modalHideTimer) {
    clearTimeout(window._modalHideTimer);
    window._modalHideTimer = null;
  }
}

function showModalAuto(title, html, ms = 5000) {
  const overlay = document.getElementById('modal-overlay');
  const t = document.getElementById('modal-title');
  const c = document.getElementById('modal-content');
  if (!overlay || !t || !c) return;
  // Clear paging state by default (callers like showEventsPaged will override this immediately after)
  // window._modalPager = null; // actually showEventsPaged sets it BEFORE calling showModalAuto, so we shouldn't clear it here.
  const headerRow = t.parentElement;
  if (headerRow) { headerRow.style.display = 'flex'; headerRow.style.flex = '0 0 10%'; }
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) closeBtn.style.display = 'none';
  const lower = String(title || '').toLowerCase();
  if (lower === 'help') { c.style.overflow = 'hidden'; c.style.minHeight = '0'; }
  else if (lower === 'calendar' || lower === 'schedule') { c.style.overflow = 'hidden'; c.style.minHeight = '0'; }
  else { c.style.overflow = 'auto'; c.style.minHeight = '0'; }
  t.textContent = (title || '').toUpperCase();
  c.innerHTML = html;
  overlay.style.display = 'flex';
  clearTimeout(window._modalHideTimer);
  window._modalHideTimer = setTimeout(() => { overlay.style.display = 'none'; }, ms);
}
function renderCalendarHtml(anns, evs) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const checkDate = (dstr, day) => {
    if (!dstr) return false;
    const d = new Date(dstr.replace(/\,/g,''));
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  };
  const inMonth = (dstr) => {
    if (!dstr) return false;
    const d = new Date(dstr.replace(/\,/g,''));
    return d.getFullYear() === year && d.getMonth() === month;
  };
  const getCellClass = (day) => {
    const hasEvent = (evs || []).some(e => checkDate(e.date, day));
    const hasAnn = (anns || []).some(a => checkDate(a.date, day));
    if (hasEvent && hasAnn) return 'cell-both';
    if (hasEvent) return 'cell-event';
    if (hasAnn) return 'cell-announcement';
    return '';
  };
  let gridHtml = '';
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  days.forEach(d => gridHtml += `<div class="cal-day-header">${d}</div>`);
  for (let i = 0; i < firstDay; i++) gridHtml += `<div class="cal-cell empty"></div>`;
  for (let i = 1; i <= daysInMonth; i++) {
    gridHtml += `
      <div class="cal-cell ${getCellClass(i)}">
        <div class="cal-date-num">${i}</div>
      </div>
    `;
  }
  return `
    <div class="cal-inner-container" style="display:flex; flex-direction:column; height:100%;">
      <div class="cal-header-row" style="flex:0 0 auto;">
         <div class="legend-item left"><div class="legend-dot dot-event"></div> Event</div>
         <div class="cal-month-name">${monthNames[month]} ${year}</div>
         <div class="legend-item right"><div class="legend-dot dot-announcement"></div> Announcement</div>
      </div>
      <div class="cal-grid" style="flex:1 1 0; min-height:0;">
         ${gridHtml}
      </div>
      ${((evs||[]).some(e => inMonth(e.date)) || (anns||[]).some(a => inMonth(a.date))) ? '' : `<div style="text-align:center; padding:10px; color:#4a5568;">No schedule for this month</div>`}
    </div>
  `;
}
function showModalNoHeader(html, ms = 5000) {
  const overlay = document.getElementById('modal-overlay');
  const t = document.getElementById('modal-title');
  const c = document.getElementById('modal-content');
  if (!overlay || !t || !c) return;
  const headerRow = t.parentElement;
  if (headerRow) { headerRow.style.display = 'flex'; headerRow.style.flex = '0 0 10%'; }
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) closeBtn.style.display = 'none';
  t.textContent = (t.textContent || '').toUpperCase();
  c.innerHTML = html;
  overlay.style.display = 'flex';
  clearTimeout(window._modalHideTimer);
  window._modalHideTimer = setTimeout(() => { overlay.style.display = 'none'; }, ms);
}

function normalizeText(s) {
  return (s || '').toLowerCase().replace(/[\.,!?]/g, '').trim();
}

function soundex(s) {
  s = (s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return '';
  const first = s[0];
  const map = { b:1,f:1,p:1,v:1, c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2, d:3,t:3, l:4, m:5,n:5, r:6 };
  let prev = map[first] || 0;
  let code = first.toUpperCase();
  for (let i = 1; i < s.length && code.length < 4; i++) {
    const ch = s[i];
    const val = map[ch] || 0;
    if (val !== 0 && val !== prev) code += String(val);
    prev = val;
  }
  while (code.length < 4) code += '0';
  return code.slice(0,4);
}

function wordDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m || !n) return Math.max(m, n);
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i++) dp[i] = i;
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      if (a[i - 1] === b[j - 1]) dp[i] = prev;
      else dp[i] = Math.min(prev + 1, dp[i] + 1, dp[i - 1] + 1);
      prev = tmp;
    }
  }
  return dp[m];
}

function fuzzyMatchToken(token, keyword) {
  if (!token || !keyword) return false;
  const t = token.replace(/[^a-z0-9]/g,'');
  const k = keyword.replace(/[^a-z0-9]/g,'');
  if (!t || !k) return false;
  if (t === k) return true;
  // consider plural/singular
  const tSing = t.replace(/(es|s)$/,'');
  const kSing = k.replace(/(es|s)$/,'');
  if (tSing && kSing && tSing === kSing) return true;
  // phonetic match
  if (soundex(t) === soundex(k)) return true;
  const d = wordDistance(t, k);
  if (k.length <= 3) return d <= 1;
  if (k.length <= 4) return (soundex(t) === soundex(k)) || (d <= 1 && t[0] === k[0]);
  if (k.length <= 6) return d <= 2;
  return d <= 3;
}

function fuzzyHasKeyword(text, keyword) {
  if (!keyword) return false;
  if (!text) return false;
  if (text.includes(keyword)) return true;
  const words = text.split(/\s+/);
  return words.some(w => fuzzyMatchToken(w, keyword));
}

function fuzzyHasAnyKeyword(text, keywords) {
  if (!keywords || !keywords.length) return false;
  return keywords.some(k => fuzzyHasKeyword(text, k));
}

function classifyIntent(text) {
  const t = normalizeText(text);
  const intents = [
    { name: 'off', keywords: ['off','turn off','power off','shut down','shutdown','screen off','screenoff','turnoff','poweroff'] },
    { name: 'on', keywords: ['on','turn on','power on','screen on','wake up'] },
    { name: 'close', keywords: ['close','clause','claus','cloze','clothes','glose','exit','dismiss','shut'] },
    { name: 'help', keywords: ['help','helf','helt','halp','hep','assist','assistance','commands','command list'] },
    { name: 'next', keywords: ['next','next page'] },
    { name: 'previous', keywords: ['previous','previous page','go back','back','prev'] },
    { name: 'announcements', keywords: ['announcement','announcements','show announcements','announcements list','full announcement','announcemnts','announcementz'] },
    { name: 'events', keywords: ['event','events','bends','show events','evnt','ivent','even','eventz'] },
    { name: 'calendar', keywords: ['calendar','schedule'] },
    { name: 'teachers', keywords: ['teacher','teachers','teachers availability','availability','faculty'] },
    { name: 'highlights', keywords: ['highlight','highlights'] },
    { name: 'date', keywords: ['date','today','tomorrow','week','month','year'] },
  ];
  const words = t.split(/\s+/);
  let best = { name: null, score: 0 };
  for (const intent of intents) {
    let score = 0;
    for (const kw of intent.keywords) {
      const exact = t.includes(kw);
      const fuzzy = fuzzyHasKeyword(t, kw);
      if (exact) score += 3;
      else if (fuzzy) score += 2;
      else {
        // token-level phonetic proximity
        for (const w of words) {
          if (fuzzyMatchToken(w, kw)) { score += 1; break; }
        }
      }
    }
    // penalties to reduce conflicts
    if (intent.name === 'next' && fuzzyHasAnyKeyword(t, ['previous','back','prev'])) score -= 2;
    if (intent.name === 'previous' && fuzzyHasAnyKeyword(t, ['next'])) score -= 2;
    if (intent.name === 'close' && fuzzyHasAnyKeyword(t, ['next'])) score -= 2; // avoid next->exit confusion
    // strict-only terms for close: count only if exact
    if (intent.name === 'close') {
      if (t.includes('exit')) score += 2; else score += 0;
      if (t.includes('dismiss')) score += 2; else score += 0;
      if (t.includes('shut')) score += 2; else score += 0;
    }
    if (intent.name === 'off') {
      if (t.includes('off')) score += 1;
    }
    if (score > best.score) best = { name: intent.name, score };
  }
  const confidence = Math.min(1, best.score / 6);
  if (!best.name || confidence < 0.34) return { intent: null, confidence: 0 };
  return { intent: best.name, confidence };
}

async function executeIntent(intent, text) {
  const t = normalizeText(text);
  if (intent === 'off') { showPowerOff(); return true; }
  if (intent === 'on') { hidePowerOff(); return true; }
  if (intent === 'help') { closeAllPopups(); showHelpPaged(0, null); return true; }
  if (intent === 'close') { closeAllPopups(); return true; }
  if (intent === 'next' && !fuzzyHasAnyKeyword(t, ['previous','back','prev'])) {
    try {
      const overlayEl = document.getElementById('modal-overlay');
      const isModalOpen = !!(overlayEl && (overlayEl.style.display !== 'none' && window.getComputedStyle(overlayEl).display !== 'none'));
      if (isModalOpen) {
        if (advanceModalPage(1)) { /* paged */ } else { return !!showOverlay('Navigation', '<div>No more pages</div>'); }
      } else {
        advanceEvents(1);
      }
    } catch {}
    showOverlay('Navigation', '<div>Next page</div>');
    return true;
  }
  if (intent === 'previous') {
    try {
      const overlayEl = document.getElementById('modal-overlay');
      const isModalOpen = !!(overlayEl && (overlayEl.style.display !== 'none' && window.getComputedStyle(overlayEl).display !== 'none'));
      if (isModalOpen) {
        if (advanceModalPage(-1)) { /* paged */ } else { return !!showOverlay('Navigation', '<div>No previous pages</div>'); }
      } else {
        advanceEvents(-1);
      }
    } catch {}
    showOverlay('Navigation', '<div>Previous page</div>');
    return true;
  }
  if (intent === 'calendar') { scheduleCalendarCommand(t); return true; }
  if (intent === 'date') {
    closeAllPopups();
    const cfg = await fetchConfig('date');
    const v = cfg && (cfg.value || cfg.date || cfg.text);
    const now = new Date();
    const disp = v || now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    logInfo('voice_command', { command: 'date' });
    showModal('Date', `<div>${disp}</div>`);
    return true;
  }
  if (intent === 'announcements') {
    closeAllPopups();
    showModalNoHeader('<div>Loading Announcements...</div>', 600000);
    const anns = await fetchAnnouncements(200);
    logInfo('voice_command', { command: 'announcements' });
    showAnnouncementsPaged(anns, 0, null);
    return true;
  }
  if (intent === 'events') {
    closeAllPopups();
    showModalNoHeader('<div>Loading Events...</div>', 600000);
    const evsAll = await fetchEvents(50);
    logInfo('voice_command', { command: 'events' });
    const list = evsAll;
    showEventsPaged(list, 0, null);
    return true;
  }
  if (intent === 'teachers') {
    closeAllPopups();
    showModalNoHeader('<div>Loading Teachers...</div>', 600000);
    const tchs = await fetchTeachers(200);
    const html = tchs.map(s => `<div style="padding:6px 8px;"><b>${s.name}</b><div style="color:#4a5568; font-size:0.85rem;">${s.availability}</div></div>`).join('');
    logInfo('voice_command', { command: 'teachers' });
    showModal('Teachers Availability', html);
    return true;
  }
  if (intent === 'highlights') {
    closeAllPopups();
    showModalNoHeader('<div>Loading Highlights...</div>', 600000);
    const hls = (await fetchHighlights(8)).slice(0, 8);
    const html = `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(4, 1fr); gap: 12px; flex:1 1 auto;">
          ${hls.map(h => `
            <div style="padding: 0; display:flex; align-items:center; justify-content:center; background: transparent;">
              <div style="width:100%; height:100%; background-image:url('${h.image}'); background-size:cover; background-position:center;"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    logInfo('voice_command', { command: 'highlights' });
    showModal('HIGHLIGHTS', html || '<div>No highlights available</div>');
    return true;
  }
  return false;
}
function getHelpData() {
  const basic = [
    ['Help', 'Shows this help pop up'],
    ['Announcements', 'Shows the full list of announcements'],
    ['Events', 'Shows the full list of events'],
    ['Highlights', 'Shows the highlights gallery'],
    ['Calendar', 'Shows the schedule in calendar'],
    ['Next', 'Moves to the next page within the current pop up'],
    ['Previous', 'Moves to the previous page within the current pop up'],
    ['Close', 'Closes the current pop up']
  ];
  const calendarCmds = [
    ['Today', 'Filters items scheduled today'],
    ['Tomorrow', 'Filters items scheduled tomorrow'],
    ['Yesterday', 'Filters items scheduled yesterday'],
    ['This week', 'Filters items scheduled this week'],
    ['Next week', 'Filters items scheduled next week'],
    ['This month', 'Filters items scheduled this month'],
    ['Next month', 'Filters items scheduled next month'],
    ['Specified month', 'Example: January'],
    ['Specified date', 'Example: 5'],
    ['Specified day', 'Example: Monday'],
    ['Month-date', 'Example: January 14'],
    ['Month-date-year', 'Example: January 2, 2026']
  ];
  return { basic, calendarCmds };
}
function renderHelpPage(pageIdx, prevIdx) {
  const { basic, calendarCmds } = getHelpData();
  const dir = prevIdx == null ? '0px' : (pageIdx > prevIdx ? '20px' : '-20px');
  const title = pageIdx === 0 ? 'Basic Commands' : 'Calendar Commands';
  let itemsSource;
  if (pageIdx === 0) {
    itemsSource = basic;
  } else if (pageIdx === 1) {
    itemsSource = calendarCmds.slice(0, 7);
  } else {
    itemsSource = calendarCmds.slice(7);
  }
  const items = itemsSource
    .map(([name, desc]) => `<div style="margin:2px 0;">• <b>${name}</b> — ${desc}</div>`).join('');
  const totalPages = 3;
  const dots = Array.from({ length: totalPages }).map((_, i) => `<span class="dot ${i===pageIdx?'active':''}" style="width:8px;height:8px;border-radius:50%;background:#000;opacity:${i===pageIdx?1:0.4};"></span>`).join('');
  return `
    <div style="display:flex; flex-direction:column; height:100%;">
      <div class="help-fit" style="flex:1 1 0; min-height:0; display:flex; flex-direction:column; gap:8px; animation: helpSlideIn 240ms ease; will-change: transform, opacity; padding: 2px 0; font-size:clamp(0.8rem, 1.5vw, 1rem); line-height:1.5; overflow:hidden; transform-origin: top left;">
        <div style="margin-bottom:6px; font-weight:bold; font-size:clamp(0.95rem, 1.8vw, 1.12rem);">Say a command directly, for example:</div>
        <div style="font-weight:bold; margin-bottom:4px; font-size:clamp(0.95rem, 1.8vw, 1.12rem);">${title}</div>
        ${items}
      </div>
      <div class="dots-wrap" style="display:flex; gap:6px; justify-content:center; padding:8px 0; flex:0 0 auto;">${dots}</div>
      <style>
        @keyframes helpSlideIn { from { transform: translateX(${dir}); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      </style>
    </div>
  `;
}
function showHelpPaged(pageIdx = 0, prevIdx = null) {
  window._modalPager = 'help';
  window._helpPageIndex = Math.max(0, Math.min(pageIdx, 2));
  const html = renderHelpPage(window._helpPageIndex, prevIdx);
  showModalAuto('HELP', html, 600000);
  setTimeout(() => fitHelpText(), 0);
}

function fitHelpText() {
  try {
    const c = document.getElementById('modal-content');
    if (!c) return;
    const el = c.querySelector('.help-fit');
    if (!el) return;
    const dots = c.querySelector('.dots-wrap');
    const availH = Math.max(0, c.clientHeight - (dots ? dots.offsetHeight : 0) - 4);
    const availW = Math.max(0, c.clientWidth - 4);
    let scale = 1.0;
    el.style.transformOrigin = 'top left';
    el.style.transform = `scale(${scale})`;
    for (let i = 0; i < 20; i++) {
      const r = el.getBoundingClientRect();
      const hOK = r.height <= availH;
      const wOK = r.width <= availW;
      if (hOK && wOK) break;
      const ratioH = (availH > 0 && r.height > 0) ? (availH / r.height) : 1;
      const ratioW = (availW > 0 && r.width > 0) ? (availW / r.width) : 1;
      const next = Math.min(ratioH, ratioW) * 0.985;
      if (!(next < 1)) break;
      scale = Math.max(0.6, scale * next);
      el.style.transform = `scale(${scale})`;
    }
  } catch (e) {
    console.error('fitHelpText error', e);
  }
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function renderAnnouncementsPage(anns, pageIdx, prevIdx) {
  const pages = chunk(anns, 5);
  const cur = pages[pageIdx] || [];
  const dir = prevIdx == null ? '0px' : (pageIdx > prevIdx ? '20px' : '-20px');
  const dots = pages.map((_, i) => `<span class="dot ${i===pageIdx?'active':''}" style="width:8px;height:8px;border-radius:50%;background:#000;opacity:${i===pageIdx?1:0.4};"></span>`).join('');
  const items = cur.map(a => `
    <div class="announcement-item" style="flex:1; min-height:0; display:flex; align-items:center; gap:10px; padding:8px;">
      <div class="icon">${a.icon || '📢'}</div>
      <div class="text" style="overflow:hidden;">
        <h3>${a.title}</h3>
        ${a.description ? `<p>${a.description}</p>` : ''}
        <p style="font-size:0.9rem; color:#334155;">${a.time} • ${a.date}</p>
      </div>
    </div>
  `).join('');
  return `
    <div style="display:flex; flex-direction:column; height:100%;">
      <div style="flex:1 1 0; display:flex; flex-direction:column; gap:8px; animation: annSlideIn 240ms ease; will-change: transform, opacity;">
        ${items || '<div style="flex:1; display:flex; align-items:center; justify-content:center; color:#4a5568;">No schedule</div>'}
      </div>
      ${pages.length>1 ? `<div class="dots-wrap" style="display:flex; gap:6px; justify-content:center; padding:12px 0; flex:0 0 auto;">${dots}</div>` : ''}
      <style>
        @keyframes annSlideIn { from { transform: translateX(${dir}); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      </style>
    </div>
  `;
}

function showAnnouncementsPaged(anns, pageIdx = 0, prevIdx = null) {
  window._modalPager = 'announcements';
  window._annFlat = anns || [];
  window._annPageIndex = pageIdx;
  const html = renderAnnouncementsPage(window._annFlat, pageIdx, prevIdx);
  showModalAuto('Announcements', html, 600000);
}

function advanceModalPage(step = 1) {
  if (window._modalPager === 'announcements' && Array.isArray(window._annFlat)) {
    const totalPages = Math.ceil(window._annFlat.length / 5);
    if (totalPages <= 1) return false;
    const prev = Math.max(0, Math.min(window._annPageIndex || 0, totalPages - 1));
    if (step > 0 && prev >= totalPages - 1) return false;
    if (step < 0 && prev <= 0) return false;
    const next = prev + step;
    window._annPageIndex = next;
    const html = renderAnnouncementsPage(window._annFlat, next, prev);
    showModalAuto('Announcements', html, 600000);
    return true;
  }
  if (window._modalPager === 'events' && Array.isArray(window._eventsFlat)) {
    // Events pages are built by renderEventsPage's pagination rules; compute total using the same logic
    const _pages = (function(list){
      const arr = Array.isArray(list) ? list.slice() : [];
      const pages = [];
      let i = 0;
      while (i < arr.length) {
        const remain = arr.length - i;
        if (remain >= 6) { pages.push(arr.slice(i, i + 6)); i += 6; }
        else if (remain === 5) { pages.push(arr.slice(i, i + 4)); i += 4; pages.push(arr.slice(i, i + 1)); i += 1; }
        else if (remain === 4) { pages.push(arr.slice(i, i + 4)); i += 4; }
        else if (remain === 3) { pages.push(arr.slice(i, i + 3)); i += 3; }
        else if (remain === 2) { pages.push(arr.slice(i, i + 2)); i += 2; }
        else { pages.push(arr.slice(i, i + 1)); i += 1; }
      }
      return pages.length ? pages : [[]];
    })(window._eventsFlat);
    const totalPages = _pages.length;
    if (totalPages <= 1) return false;
    const prev = Math.max(0, Math.min(window._eventsPageIndex || 0, totalPages - 1));
    if (step > 0 && prev >= totalPages - 1) return false;
    if (step < 0 && prev <= 0) return false;
    const next = prev + step;
    window._eventsPageIndex = next;
    const html = renderEventsPage(window._eventsFlat, next, prev);
    showModalAuto('UPCOMING EVENTS', html, 600000);
    return true;
  }
  if (window._modalPager === 'combined' && Array.isArray(window._combinedPages)) {
    const totalPages = window._combinedPages.length;
    if (totalPages <= 1) return false;
    const prev = Math.max(0, Math.min(window._combinedPageIndex || 0, totalPages - 1));
    if (step > 0 && prev >= totalPages - 1) return false;
    if (step < 0 && prev <= 0) return false;
    const next = prev + step;
    window._combinedPageIndex = next;
    const html = renderCombinedPage(window._combinedPages[next], next, totalPages, prev);
    showModalAuto('Schedule', html, 600000);
    return true;
  }
  if (window._modalPager === 'help') {
    const totalPages = 3;
    const prev = Math.max(0, Math.min(window._helpPageIndex || 0, totalPages - 1));
    if (step > 0 && prev >= totalPages - 1) return false;
    if (step < 0 && prev <= 0) return false;
    const next = prev + step;
    window._helpPageIndex = next;
    showHelpPaged(next, prev);
    return true;
  }
  return false;
}

function renderEventsPage(evs, pageIdx, prevIdx) {
  const eventsToPages = (list) => {
    const arr = Array.isArray(list) ? list.slice() : [];
    const pages = [];
    let i = 0;
    while (i < arr.length) {
      const remain = arr.length - i;
      if (remain >= 6) {
        pages.push(arr.slice(i, i + 6));
        i += 6;
      } else if (remain === 5) {
        pages.push(arr.slice(i, i + 4));
        i += 4;
        pages.push(arr.slice(i, i + 1));
        i += 1;
      } else if (remain === 4) {
        pages.push(arr.slice(i, i + 4));
        i += 4;
      } else if (remain === 3) {
        pages.push(arr.slice(i, i + 2));
        i += 2;
        pages.push(arr.slice(i, i + 1));
        i += 1;
      } else if (remain === 2) {
        pages.push(arr.slice(i, i + 2));
        i += 2;
      } else { // 1
        pages.push(arr.slice(i, i + 1));
        i += 1;
      }
    }
    if (!pages.length) pages.push([]);
    return pages;
  };
  const pages = eventsToPages(evs);
  const cur = pages[pageIdx] || [];
  const dir = prevIdx == null ? '0px' : (pageIdx > prevIdx ? '20px' : '-20px');
  const dots = pages.map((_, i) => `<span class="dot ${i===pageIdx?'active':''}" style="width:8px;height:8px;border-radius:50%;background:#000;opacity:${i===pageIdx?1:0.4};"></span>`).join('');
  const count = cur.length;
  let gridCols = 1;
  let gridRowsCss = `repeat(${count}, 1fr)`;
  if (count === 6) { gridCols = 2; gridRowsCss = `repeat(3, 1fr)`; }
  else if (count === 4) { gridCols = 2; gridRowsCss = `repeat(2, 1fr)`; }
  else { gridCols = 1; gridRowsCss = `repeat(${Math.max(1,count)}, 1fr)`; }
  const items = cur.map((e, i) => {
    const span = '';
    return `
      <div style="display:flex; flex-direction:column; gap:6px; padding:6px; ${span}">
        <div style="flex:1; width:100%; background-image:url('${e.image}'); background-size:cover; background-position:center; border-radius:4px;"></div>
        <div style="font-weight:bold; text-align:center;">${e.title}</div>
        <div style="color:#4a5568; font-size:0.85rem; text-align:center;">${e.date}</div>
      </div>
    `;
  }).join('');
  return `
    <div style="display:flex; flex-direction:column; height:100%;">
      <div style="flex:1; animation: evSlideIn 240ms ease; will-change: transform, opacity; display:grid; grid-template-columns: repeat(${gridCols}, 1fr); grid-template-rows: ${gridRowsCss}; gap: 12px;">
        ${items || '<div style="grid-column: 1 / -1; display:flex; align-items:center; justify-content:center; color:#4a5568;">No schedule</div>'}
      </div>
      ${pages.length>1 ? `<div class="dots-wrap" style="display:flex; gap:6px; justify-content:center; padding:12px 0; flex:0 0 auto;">${dots}</div>` : ''}
      <style>
        @keyframes evSlideIn { from { transform: translateX(${dir}); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      </style>
    </div>
  `;
}

function showEventsPaged(evs, pageIdx = 0, prevIdx = null) {
  window._modalPager = 'events';
  window._eventsFlat = evs || [];
  window._eventsPageIndex = pageIdx;
  const html = renderEventsPage(window._eventsFlat, pageIdx, prevIdx);
  showModalAuto('UPCOMING EVENTS', html, 600000);
}
function renderAnnListCompact(anns) {
  const items = anns.map(a => `
    <div class="announcement-item" style="flex:1; min-height:0; display:flex; align-items:center; gap:10px; padding:8px;">
      <div class="icon">${a.icon || '📢'}</div>
      <div class="text" style="overflow:hidden; display:flex; flex-direction:column;">
        <h3 style="margin:0;">${a.title}</h3>
        ${a.description ? `<p style="margin:2px 0 0;">${a.description}</p>` : ''}
        <p style="font-size:0.9rem; color:#334155; margin-top:auto;">${a.time || ''} ${a.time ? '•' : ''} ${a.date || ''}</p>
      </div>
    </div>
  `).join('');
  return `<div style="display:flex; flex-direction:column; height:100%; gap:8px;">${items || '<div style="flex:1; display:flex; align-items:center; justify-content:center; color:#4a5568;">No announcements</div>'}</div>`;
}
function renderEvtListCompact(evs) {
  const items = evs.map(e => `
    <div style="flex:1; min-height:0; display:flex; flex-direction:column; gap:6px; padding:6px;">
      <div style="flex:1; width:100%; background-image:url('${e.image}'); background-size:cover; background-position:center; border-radius:4px;"></div>
      <div style="font-weight:bold; text-align:center;">${e.title}</div>
      <div style="color:#4a5568; font-size:0.85rem; text-align:center;">${e.date}</div>
    </div>
  `).join('');
  return `<div style="display:flex; flex-direction:column; height:100%; gap:8px;">${items || '<div style="flex:1; display:flex; align-items:center; justify-content:center; color:#4a5568;">No events</div>'}</div>`;
}
function renderAnnItemCompact(a) {
  return `
    <div class="announcement-item" style="flex:1; min-height:0; display:flex; align-items:center; gap:10px; padding:8px;">
      <div class="icon">${a.icon || '📢'}</div>
      <div class="text" style="overflow:hidden; display:flex; flex-direction:column;">
        <h3 style="margin:0;">${a.title}</h3>
        ${a.description ? `<p style="margin:2px 0 0;">${a.description}</p>` : ''}
        <p style="font-size:0.9rem; color:#334155; margin-top:auto;">${a.time || ''} ${a.time ? '•' : ''} ${a.date || ''}</p>
      </div>
    </div>
  `;
}
function renderEvtItemCompact(e) {
  return `
    <div style="flex:1; min-height:0; display:flex; flex-direction:column; gap:6px; padding:6px;">
      <div style="flex:1; width:100%; background-image:url('${e.image}'); background-size:cover; background-position:center; border-radius:4px;"></div>
      <div style="font-weight:bold; text-align:center;">${e.title}</div>
      <div style="color:#4a5568; font-size:0.85rem; text-align:center;">${e.date}</div>
    </div>
  `;
}
function makeCombinedPages(anns, evs, limit = 6) {
  const a = Array.isArray(anns) ? anns.slice() : [];
  const b = Array.isArray(evs) ? evs.slice() : [];
  const pages = [];
  let ai = 0, bi = 0;
  const MAX = 5;
  while (ai < a.length || bi < b.length) {
    let takeA = 0, takeB = 0;
    const aLeft = a.length - ai;
    const bLeft = b.length - bi;
    if (aLeft > 0) {
      if (aLeft >= 5) { takeA = 5; takeB = 0; }
      else if (aLeft === 4) { takeA = 4; takeB = 0; }
      else if (aLeft === 3) { takeA = 3; takeB = bLeft > 0 ? 1 : 0; }
      else if (aLeft === 2) { takeA = 2; takeB = bLeft > 0 ? 1 : 0; }
      else if (aLeft === 1) { takeA = 1; takeB = bLeft > 0 ? 1 : 0; }
    } else {
      if (bLeft >= 6) { takeB = 6; }
      else if (bLeft === 5) { takeB = 4; }
      else if (bLeft === 4) { takeB = 4; }
      else if (bLeft === 3) { takeB = 2; }
      else if (bLeft === 2) { takeB = 2; }
      else { takeB = 1; }
    }
    pages.push({ anns: a.slice(ai, ai + takeA), evs: b.slice(bi, bi + takeB) });
    ai += takeA; bi += takeB;
  }
  if (!pages.length) pages.push({ anns: [], evs: [] });
  return pages;
}
function renderCombinedPage(page, pageIdx, totalPages, prevIdx) {
  const dir = prevIdx == null ? '0px' : (pageIdx > prevIdx ? '20px' : '-20px');
  const dots = Array.from({ length: totalPages }).map((_, i) => `<span class="dot ${i===pageIdx?'active':''}" style="width:8px;height:8px;border-radius:50%;background:#000;opacity:${i===pageIdx?1:0.4};"></span>`).join('');
  const a = page.anns || [];
  const e = page.evs || [];
  const renderEventsSimple = (list) => {
    const count = list.length;
    let gridCols = 1;
    let gridRowsCss = `repeat(${Math.max(1,count)}, 1fr)`;
    if (count === 6) { gridCols = 2; gridRowsCss = `repeat(3, 1fr)`; }
    else if (count === 4) { gridCols = 2; gridRowsCss = `repeat(2, 1fr)`; }
    const items = list.map((ev) => `
      <div style="display:flex; flex-direction:column; gap:6px; padding:6px;">
        <div style="flex:1; width:100%; background-image:url('${ev.image}'); background-size:cover; background-position:center; border-radius:4px;"></div>
        <div style="font-weight:bold; text-align:center;">${ev.title}</div>
        <div style="color:#4a5568; font-size:0.85rem; text-align:center;">${ev.date}</div>
      </div>
    `).join('');
    return `
      <div style="flex:1 1 0; animation: combSlideIn 240ms ease; display:grid; grid-template-columns: repeat(${gridCols}, 1fr); grid-template-rows: ${gridRowsCss}; gap: 12px;">
        ${items || '<div style="display:flex; align-items:center; justify-content:center; color:#4a5568;">No events</div>'}
      </div>
    `;
  };
  if (!a.length && e.length) {
    const eOnly = renderEventsSimple(e);
    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="flex:1 1 0; min-height:0; display:flex; flex-direction:column;">
          ${eOnly}
        </div>
        ${totalPages>1 ? `<div class="dots-wrap" style="display:flex; gap:6px; justify-content:center; padding:12px 0; flex:0 0 auto;">${dots}</div>` : ''}
        <style>
          @keyframes combSlideIn { from { transform: translateX(${dir}); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        </style>
      </div>
    `;
  }
  if (!a.length && !e.length) {
    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="flex:1 1 0; min-height:0; display:flex; align-items:center; justify-content:center; color:#4a5568;">
          No schedule
        </div>
      </div>
    `;
  }
  const aHtml = a.map(renderAnnItemCompact).join('') || '<div style="flex:1; display:flex; align-items:center; justify-content:center; color:#4a5568;">No announcements</div>';
  const eHtmlBlock = e.length ? renderEventsSimple(e.slice(0,1)) : '';
  let aH = '100%';
  let eH = '0%';
  if (a.length === 5) { aH = '100%'; eH = '0%'; }
  else if (a.length === 4) { aH = '100%'; eH = '0%'; }
  else if ((a.length === 3 || a.length === 2) && e.length >= 1) { aH = '60%'; eH = '40%'; }
  else if (a.length === 1 && e.length >= 1) { aH = '20%'; eH = '80%'; }
  else if (!a.length && e.length) { aH = '0%'; eH = '100%'; }
  return `
    <div style="display:flex; flex-direction:column; height:100%;">
      <div style="flex:1 1 0; min-height:0; display:flex; flex-direction:column;">
        ${a.length ? `<div style="flex:0 0 ${aH}; min-height:0; animation: combSlideIn 240ms ease; display:flex; flex-direction:column; gap:0.5em;">${aHtml}</div>` : ''}
        ${a.length && e.length ? `<div style="height:1em; flex:0 0 auto;"></div>` : ''}
        ${e.length ? `<div style="flex:0 0 ${eH}; min-height:0; display:flex; flex-direction:column;">${eHtmlBlock}</div>` : ''}
      </div>
      ${totalPages>1 ? `<div class="dots-wrap" style="display:flex; gap:6px; justify-content:center; padding:12px 0; flex:0 0 auto;">${dots}</div>` : ''}
      <style>
        @keyframes combSlideIn { from { transform: translateX(${dir}); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      </style>
    </div>
  `;
}
function showCombinedSchedulePaged(anns, evs, pageIdx = 0, prevIdx = null) {
  window._modalPager = 'combined';
  window._combinedPages = makeCombinedPages(anns || [], evs || [], 5);
  window._combinedPageIndex = Math.max(0, Math.min(pageIdx, window._combinedPages.length - 1));
  const html = renderCombinedPage(window._combinedPages[window._combinedPageIndex], window._combinedPageIndex, window._combinedPages.length, prevIdx);
  showModalAuto('Schedule', html, 600000);
}
function _parseDateSafe(dstr) {
  if (!dstr) return null;
  try {
    return new Date(String(dstr).replace(/\,/g,''));
  } catch { return null; }
}
function _deriveTags(entry) {
  const d = _parseDateSafe(entry && entry.date);
  if (!d || isNaN(d.getTime())) return { year:null, monthIndex:null, monthName:null, date:null, weekdayIndex:null, weekdayName:null };
  const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const weekdayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  return {
    year: d.getFullYear(),
    monthIndex: d.getMonth(),
    monthName: monthNames[d.getMonth()],
    date: d.getDate(),
    weekdayIndex: d.getDay(),
    weekdayName: weekdayNames[d.getDay()]
  };
}
function detectTagQuery(ntext) {
  const n = normalizeText(ntext);
  const out = { year:null, monthName:null, date:null, weekdayName:null, range:null, want:'both' };
  if (n.includes('announcements')) out.want = 'announcements';
  if (n.includes('events')) out.want = (out.want==='announcements' ? 'both' : 'events');
  if (n.includes('today')) {
    const now = new Date(); const from = new Date(now.setHours(0,0,0,0)); const to = new Date(now.setHours(23,59,59,999));
    out.range = { from, to }; return out;
  }
  if (n.includes('yesterday')) {
    const d = new Date(); d.setDate(d.getDate()-1);
    out.range = { from: new Date(d.setHours(0,0,0,0)), to: new Date(d.setHours(23,59,59,999)) }; return out;
  }
  if (n.includes('tomorrow')) {
    const d = new Date(); d.setDate(d.getDate()+1);
    out.range = { from: new Date(d.setHours(0,0,0,0)), to: new Date(d.setHours(23,59,59,999)) }; return out;
  }
  if (n.includes('this week')) {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = (day+6)%7;
    const monday = new Date(d); monday.setDate(d.getDate()-diffToMonday); monday.setHours(0,0,0,0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
    out.range = { from: monday, to: sunday }; return out;
  }
  if (n.includes('next week')) {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = (day+6)%7;
    const monday = new Date(d); monday.setDate(d.getDate()-diffToMonday+7); monday.setHours(0,0,0,0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
    out.range = { from: monday, to: sunday }; return out;
  }
  if (n.includes('this month')) {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0);
    const last = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999);
    out.range = { from: first, to: last }; return out;
  }
  if (n.includes('next month')) {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth()+1, 1, 0,0,0,0);
    const last = new Date(d.getFullYear(), d.getMonth()+2, 0, 23,59,59,999);
    out.range = { from: first, to: last }; return out;
  }
  const yearMatch = n.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) out.year = parseInt(yearMatch[0],10);
  const monthMatch = n.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/);
  if (monthMatch) {
    const map = { jan:'january', feb:'february', mar:'march', apr:'april', may:'may', jun:'june', jul:'july', aug:'august', sep:'september', oct:'october', nov:'november', dec:'december' };
    const k = monthMatch[0].slice(0,3);
    out.monthName = map[k] || monthMatch[0];
  }
  const nums = (n.match(/\b\d{1,4}\b/g) || []).map(s => parseInt(s,10));
  const numDate = nums.find(x => x >= 1 && x <= 31 && x !== out.year);
  if (numDate != null) out.date = numDate;
  const weekdayMatch = n.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch) out.weekdayName = weekdayMatch[1] || weekdayMatch[0];
  return out;
}
function hasTagQuery(ntext) {
  const t = detectTagQuery(ntext);
  return !!(t.year || t.monthName || t.date || t.weekdayName || t.range);
}
function filterByTags(arr, tags) {
  if (!Array.isArray(arr) || !arr.length) return [];
  if (tags.range) {
    return arr.filter(x => {
      const d = _parseDateSafe(x.date);
      return d && d >= tags.range.from && d <= tags.range.to;
    });
  }
  return arr.filter(x => {
    const t = _deriveTags(x);
    if (tags.year != null && t.year !== tags.year) return false;
    if (tags.monthName && t.monthName !== tags.monthName) return false;
    if (tags.date != null && t.date !== tags.date) return false;
    if (tags.weekdayName && t.weekdayName !== tags.weekdayName) return false;
    return true;
  });
}
function parseDate(text) {
  const now = new Date();
  const n = normalizeText(text);
  if (n.includes('today')) return { from: new Date(now.setHours(0,0,0,0)), to: new Date(now.setHours(23,59,59,999)) };
  if (n.includes('yesterday')) {
    const d = new Date(); d.setDate(d.getDate()-1);
    return { from: new Date(d.setHours(0,0,0,0)), to: new Date(d.setHours(23,59,59,999)) };
  }
  if (n.includes('tomorrow')) {
    const d = new Date(); d.setDate(d.getDate()+1);
    return { from: new Date(d.setHours(0,0,0,0)), to: new Date(d.setHours(23,59,59,999)) };
  }
  if (n.includes('this week')) {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = (day+6)%7; // 0=Sunday
    const monday = new Date(d); monday.setDate(d.getDate()-diffToMonday); monday.setHours(0,0,0,0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
    return { from: monday, to: sunday };
  }
  if (n.includes('next week')) {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = (day+6)%7;
    const monday = new Date(d); monday.setDate(d.getDate()-diffToMonday+7); monday.setHours(0,0,0,0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
    return { from: monday, to: sunday };
  }
  if (n.includes('this month')) {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0);
    const last = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999);
    return { from: first, to: last };
  }
  if (n.includes('next month')) {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth()+1, 1, 0,0,0,0);
    const last = new Date(d.getFullYear(), d.getMonth()+2, 0, 23,59,59,999);
    return { from: first, to: last };
  }
  const num = n.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (num) {
    const mm = parseInt(num[1],10);
    const dd = parseInt(num[2],10);
    const yy = num[3] ? parseInt(num[3],10) : new Date().getFullYear();
    const year = yy < 100 ? (2000 + yy) : yy;
    const d = new Date(year, mm-1, dd, 0,0,0,0);
    const e = new Date(year, mm-1, dd, 23,59,59,999);
    return { from: d, to: e };
  }
  const m = n.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:\s*(\d{4}))?/);
  if (m) {
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const month = monthNames.indexOf(m[1]);
    const day = parseInt(m[2],10);
    const year = m[3] ? parseInt(m[3],10) : new Date().getFullYear();
    const d = new Date(year, month, day, 0,0,0,0);
    const e = new Date(year, month, day, 23,59,59,999);
    return { from: d, to: e };
  }
  const mOnly = n.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s*(\d{4}))?$/);
  if (mOnly) {
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const month = monthNames.indexOf(mOnly[1]);
    const year = mOnly[2] ? parseInt(mOnly[2],10) : new Date().getFullYear();
    const first = new Date(year, month, 1, 0,0,0,0);
    const last = new Date(year, month+1, 0, 23,59,59,999);
    return { from: first, to: last };
  }
  const range = n.match(/from\s+([a-z]+\s+\d{1,2})(?:\s*(\d{4}))?\s+to\s+([a-z]+\s+\d{1,2})(?:\s*(\d{4}))?/);
  if (range) {
    const parsePart = (p, y) => parseDate(p + ' ' + (y || ''));
    const a = parsePart(range[1], range[2]);
    const b = parsePart(range[3], range[4]);
    if (a && b) return { from: a.from, to: b.to };
  }
  return null;
}

function closeAllPopups() {
  hideModal();
  hideOverlay();
}

function scheduleCalendarCommand(text) {
  const t = normalizeText(text);
  window._calendarBufferedText = (window._calendarBufferedText ? (window._calendarBufferedText + ' ' + t) : t);
  clearTimeout(window._calendarDebounceTimer);
  window._calendarDebounceTimer = setTimeout(executeBufferedCalendar, 1500);
}

async function executeBufferedCalendar() {
  try {
    const q = normalizeText(window._calendarBufferedText || '');
    window._calendarBufferedText = '';
    if (!q) return;
    closeAllPopups();
    window._busyCalendar = true;
    showModalNoHeader('<div>Loading...</div>', 600000);
    const annsAll = await fetchAnnouncements(200);
    const evsAll = await fetchEvents(200);
    const qtags = detectTagQuery(q);
    const hasTags = !!(qtags.year || qtags.monthName || qtags.date || qtags.weekdayName || qtags.range);
    if (hasTags) {
      const anns = filterByTags(annsAll, qtags);
      const evs = filterByTags(evsAll, qtags);
      window._busyCalendar = false;
      if (qtags.want === 'announcements') return showAnnouncementsPaged(anns, 0, null);
      if (qtags.want === 'events') return showEventsPaged(evs, 0, null);
      return showCombinedSchedulePaged(anns, evs, 0, null);
    }
    const range = parseDate(q);
    if (range) {
      const inRangeAnn = (a) => {
        const dstr = (a.date || '').replace(/\,/g,''); const d = new Date(dstr);
        return d >= range.from && d <= range.to;
      };
      const inRangeEvt = (e) => {
        const dstr = (e.date || '').replace(/\,/g,''); const d = new Date(dstr);
        return d >= range.from && d <= range.to;
      };
      const anns = annsAll.filter(inRangeAnn);
      const evs = evsAll.filter(inRangeEvt);
      window._busyCalendar = false;
      return showCombinedSchedulePaged(anns, evs, 0, null);
    }
    if (q.includes('calendar')) {
      const html = renderCalendarHtml(annsAll, evsAll);
      window._busyCalendar = false;
      return showModal('Calendar', html);
    }
    window._busyCalendar = false;
  } catch (e) {
    window._busyCalendar = false;
  }
}

async function handleVoice(text) {
  const q = normalizeText(text);
  const data = getData();
  const t = q;
  if (window._busyCalendar) { if (fuzzyHasKeyword(t, 'close')) { closeAllPopups(); window._busyCalendar = false; } return; }
  
  // Log for debugging
  console.log('Voice Command:', t);

  const guess = classifyIntent(t);
  if (guess && guess.intent) {
    try {
      const nowTs = Date.now();
      if (['next','previous'].includes(guess.intent) && (nowTs - (window._lastIntentTs || 0)) < 1200 && window._lastIntent === guess.intent) {
        return;
      }
      const ok = await executeIntent(guess.intent, t);
      if (ok) {
        window._lastIntent = guess.intent;
        window._lastIntentTs = nowTs;
        return;
      }
    } catch {}
  }

  if (fuzzyHasAnyKeyword(t, ['off', 'turn off', 'power off', 'shut down', 'screen off'])) {
    showPowerOff();
    return;
  }
  if (fuzzyHasAnyKeyword(t, ['on', 'turn on', 'power on', 'screen on', 'wake up'])) {
    hidePowerOff();
    return;
  }

  if (fuzzyHasAnyKeyword(t, ['help', 'what can you do', 'commands', 'command list', 'halp', 'assist', 'assistance'])) {
    closeAllPopups();
    return showHelpPaged(0, null);
  }
  if (fuzzyHasAnyKeyword(t, ['close','clause','claus','cloze','clothes','glose','shut','exit','dismiss'])) { 
    closeAllPopups(); 
    return; 
  }

  if (fuzzyHasAnyKeyword(t, ['next', 'next page']) && !fuzzyHasAnyKeyword(t, ['previous', 'back', 'prev'])) { 
    try { 
      const overlayEl = document.getElementById('modal-overlay');
      const isModalOpen = !!(overlayEl && (overlayEl.style.display !== 'none' && window.getComputedStyle(overlayEl).display !== 'none'));
      
      if (isModalOpen) {
        // If modal is open, ONLY try to page the modal.
        // If the modal doesn't support paging (advanceModalPage returns false), do nothing or show feedback.
        if (advanceModalPage(1)) {
           // Successfully paged
        } else {
           // Modal open but no pages (or not a paged modal)
           return showOverlay('Navigation', '<div>No more pages</div>');
        }
      } else {
        // No modal open, advance background slider
        advanceEvents(1);
      }
    } catch (e) { console.error(e); } 
    return showOverlay('Navigation', '<div>Next page</div>'); 
  }

  if (fuzzyHasAnyKeyword(t, ['previous', 'previous page', 'go back', 'back', 'prev'])) { 
    try { 
      const overlayEl = document.getElementById('modal-overlay');
      const isModalOpen = !!(overlayEl && (overlayEl.style.display !== 'none' && window.getComputedStyle(overlayEl).display !== 'none'));
      
      if (isModalOpen) {
        if (advanceModalPage(-1)) {
           // Successfully paged
        } else {
           return showOverlay('Navigation', '<div>No previous pages</div>');
        }
      } else {
        advanceEvents(-1);
      }
    } catch (e) { console.error(e); } 
    return showOverlay('Navigation', '<div>Previous page</div>'); 
  }
  if (fuzzyHasKeyword(t, 'calendar') || hasTagQuery(t) || parseDate(t)) { scheduleCalendarCommand(t); return; }
  if (t === 'date' || fuzzyHasKeyword(t, 'date')) {
    closeAllPopups();
    const cfg = await fetchConfig('date');
    const v = cfg && (cfg.value || cfg.date || cfg.text);
    const now = new Date();
    const disp = v || now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    logInfo('voice_command', { command: 'date' });
    return showModal('Date', `<div>${disp}</div>`);
  }
  // Tag commands are handled via debounce above

  if (/^(show|open)\s+(office|office information)/.test(t) || fuzzyHasAnyKeyword(t, ['registrar', 'clinic', 'guidance', 'office'])) {
    closeAllPopups();
    const off = await fetchConfig('officeInfo') || {};
    const fs = await fetchConfig('facilityStatus') || {};
    const html = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div><b>Registrar:</b> ${off.registrarHours}</div>
      <div><b>Clinic:</b> ${off.clinicStatus}</div>
      <div><b>Guidance:</b> ${off.guidanceAvailability}</div>
      <div><b>Library:</b> ${fs.library}</div>
      <div><b>Canteen:</b> ${fs.canteen}</div>
      <div><b>Laboratory:</b> ${fs.laboratory}</div>
    </div>`;
    return showModal('Faculty Status', html);
  }

  if (fuzzyHasAnyKeyword(t, ['library', 'canteen', 'laboratory', 'facility'])) {
    closeAllPopups();
    const off = await fetchConfig('officeInfo') || {};
    const fs = await fetchConfig('facilityStatus') || {};
    const html = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div><b>Registrar:</b> ${off.registrarHours}</div>
      <div><b>Clinic:</b> ${off.clinicStatus}</div>
      <div><b>Guidance:</b> ${off.guidanceAvailability}</div>
      <div><b>Library:</b> ${fs.library}</div>
      <div><b>Canteen:</b> ${fs.canteen}</div>
      <div><b>Laboratory:</b> ${fs.laboratory}</div>
    </div>`;
    return showModal('Faculty Status', html);
  }

  if (fuzzyHasKeyword(t, 'room')) {
    closeAllPopups();
    const rooms = await fetchRooms();
    const free = rooms.filter(r => normalizeText(r.status) === 'free').map(r => r.name).slice(0,6);
    const occ = rooms.filter(r => normalizeText(r.status) === 'occupied').map(r => r.name).slice(0,6);
    return showOverlay('Room Availability', `
      <div><b>Free:</b> ${free.join(', ') || 'None'}</div>
      <div><b>Occupied:</b> ${occ.join(', ') || 'None'}</div>
    `);
  }

  if (t.includes('full announcement') || t.includes('show announcements') || t.includes('announcements list') || fuzzyHasKeyword(t, 'announcement')) {
    closeAllPopups();
    showModalNoHeader('<div>Loading Announcements...</div>', 600000); // Instant feedback
    const anns = await fetchAnnouncements(200);
    logInfo('voice_command', { command: 'announcements' });
    return showAnnouncementsPaged(anns, 0, null);
  }

  const calRange = parseDate(t);
  if ((fuzzyHasAnyKeyword(t, ['schedule']) || (fuzzyHasAnyKeyword(t, ['event','events']) && fuzzyHasKeyword(t, 'on')) || (fuzzyHasAnyKeyword(t, ['announcement','announcements']) && fuzzyHasKeyword(t, 'on'))) && calRange) {
    closeAllPopups();
    showModalNoHeader('<div>Loading...</div>', 600000);
    const annsAll = await fetchAnnouncements(200);
    const evsAll = await fetchEvents(200);
    const textLower = t;
    let md = null;
    const m1 = textLower.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?!\s*\d{4})/);
    if (m1) {
      const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      md = { m: monthNames.indexOf(m1[1]), d: parseInt(m1[2],10), hasYear: false };
    } else {
      const m2 = textLower.match(/(\d{1,2})[\/\-](\d{1,2})(?![\/\-]\d{2,4})/);
      if (m2) md = { m: parseInt(m2[1],10)-1, d: parseInt(m2[2],10), hasYear: false };
    }
    if (md && !md.hasYear) {
      const yearsFrom = (arr) => {
        return arr.map(x => {
          const d = new Date(String(x.date || '').replace(/\,/g,''));
          return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
        }).filter(p => p.m === md.m && p.d === md.d).map(p => p.y);
      };
      const useBoth = fuzzyHasKeyword(t, 'schedule');
      const poolYears = useBoth ? yearsFrom(annsAll).concat(yearsFrom(evsAll)) 
                                : (fuzzyHasKeyword(t, 'event') ? yearsFrom(evsAll) : yearsFrom(annsAll));
      if (poolYears.length) {
        const latestYear = Math.max.apply(null, poolYears);
        const from = new Date(latestYear, md.m, md.d, 0,0,0,0);
        const to = new Date(latestYear, md.m, md.d, 23,59,59,999);
        calRange.from = from; calRange.to = to;
      }
    }
    const inRangeAnn = (a) => {
      const dstr = (a.date || '').replace(/\,/g,'');
      const d = new Date(dstr);
      return d >= calRange.from && d <= calRange.to;
    };
    const inRangeEvt = (e) => {
      const dstr = (e.date || '').replace(/\,/g,'');
      const d = new Date(dstr);
      return d >= calRange.from && d <= calRange.to;
    };
    const anns = annsAll.filter(inRangeAnn);
    const evs = evsAll.filter(inRangeEvt);
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    const titleDate = calRange.from.toLocaleDateString('en-US', opts);
    if (fuzzyHasKeyword(t, 'schedule')) {
      const html = `<div><div style="font-weight:bold; margin-bottom:6px;">Events</div>${(evs.length?evs:[]).map(e => `<div>${e.title} — ${e.date}</div>`).join('') || '<div>No events</div>'}<div style="font-weight:bold; margin:10px 0 6px;">Announcements</div>${(anns.length?anns:[]).map(a => `<div>${a.title} — ${a.time} • ${a.date}</div>`).join('') || '<div>No announcements</div>'}</div>`;
      logInfo('voice_command', { command: 'calendar_schedule' });
      return showModal(`Calendar — ${titleDate}`, html);
    }
    if (fuzzyHasAnyKeyword(t, ['event','events'])) {
      const html = `<div><div style="font-weight:bold; margin-bottom:6px;">Events</div>${(evs.length?evs:[]).map(e => `<div>${e.title} — ${e.date}</div>`).join('') || '<div>No events</div>'}</div>`;
      logInfo('voice_command', { command: 'calendar_events_on' });
      return showModal(`Calendar — ${titleDate}`, html);
    }
    if (fuzzyHasAnyKeyword(t, ['announcement','announcements'])) {
      const html = `<div><div style="font-weight:bold; margin-bottom:6px;">Announcements</div>${(anns.length?anns:[]).map(a => `<div>${a.title} — ${a.time} • ${a.date}</div>`).join('') || '<div>No announcements</div>'}</div>`;
      logInfo('voice_command', { command: 'calendar_announcements_on' });
      return showModal(`Calendar — ${titleDate}`, html);
    }
  }

  if (fuzzyHasAnyKeyword(t, ['teacher', 'teachers', 'teachers availability', 'availability', 'faculty'])) {
    closeAllPopups();
    showModalNoHeader('<div>Loading Teachers...</div>', 600000);
    const tchs = await fetchTeachers(200);
    const html = tchs.map(s => `<div style="padding:6px 8px;"><b>${s.name}</b><div style="color:#4a5568; font-size:0.85rem;">${s.availability}</div></div>`).join('');
    logInfo('voice_command', { command: 'teachers' });
    return showModal('Teachers Availability', html);
  }

  if (fuzzyHasAnyKeyword(t, ['event','events'])) {
    closeAllPopups();
    showModalNoHeader('<div>Loading Events...</div>', 600000);
    const range = parseDate(t);
    const evsAll = await fetchEvents(50);
    let evs = evsAll;
    if (range) {
      const inRange = (e) => {
        const dstr = (e.date || '').replace(/\,/g,'');
        const d = new Date(dstr);
        return d >= range.from && d <= range.to;
      };
      evs = evsAll.filter(inRange);
    }
    logInfo('voice_command', { command: 'events' });
    const list = (evs.length ? evs : evsAll);
    return showEventsPaged(list, 0, null);
  }

  // Calendar base is handled via debounce above
  if (fuzzyHasKeyword(t, 'highlight')) {
    closeAllPopups();
    showModalNoHeader('<div>Loading Highlights...</div>', 600000);
    const hls = (await fetchHighlights(8)).slice(0, 8);
    const html = `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(4, 1fr); gap: 12px; flex:1 1 auto;">
          ${hls.map(h => `
            <div style="padding: 0; display:flex; align-items:center; justify-content:center; background: transparent;">
              <div style="width:100%; height:100%; background-image:url('${h.image}'); background-size:cover; background-position:center;"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    logInfo('voice_command', { command: 'highlights' });
    return showModalAuto('HIGHLIGHTS', html || '<div>No highlights available</div>', 5000);
  }

  if (t.includes('qr')) {
    closeAllPopups();
    return showModalAuto('HELP', helpHTML(), 600000);
  }

  // Fallback: Do NOT show help by default to avoid confusion
  // return showModalAuto('HELP', helpHTML(), 600000);
  return;
}
function advanceEvents(step = 1) {
  const cards = Array.from(document.querySelectorAll('#events-list .event-card'));
  if (!cards.length) return;
  let idx = cards.findIndex(c => c.classList.contains('active'));
  if (idx < 0) idx = 0;
  cards.forEach(c => c.classList.remove('active'));
  idx = (idx + step + cards.length) % cards.length;
  cards[idx].classList.add('active');
  const dots = Array.from(document.querySelectorAll('.section-activities .dots-wrap .dot'));
  if (dots.length) {
    dots.forEach(d => d.classList.remove('active'));
    dots[idx % dots.length].classList.add('active');
  }
}
// --- Dashboard Render Logic ---
async function renderDashboard() {
  const data = getData();
  const db = getFirestoreDB();

  // 1. Announcements
  const annContainer = document.getElementById('announcements-list');
  if (annContainer && db) {
    try {
      db.collection('announcements').orderBy('createdAt','desc').limit(50).onSnapshot((snap) => {
        const annsRaw = snap.docs.map(d => d.data());
        const parseAnn = (a) => {
          const dstr = (a.date || '').replace(/\,/g,'');
          const dt = new Date(dstr + ' ' + (a.time || ''));
          return { ...a, _ts: dt.getTime() || 0, pinned: !!a.pinned };
        };
        const anns = annsRaw.map(parseAnn)
          .sort((x,y) => (y.pinned - x.pinned) || (x._ts - y._ts))
          .slice(0, 50); 
        annContainer.innerHTML = anns.map(a => `
          <div class="announcement-item">
            <div class="icon">${a.icon || '📢'}</div>
            <div class="text">
              <h3>${a.title}</h3>
              ${a.description ? `<p>${a.description}</p>` : ''}
            </div>
          </div>
        `).join('');
      });
    } catch {}
  }

  // 2. Calendar Widget (Month View with Dots)
  const calContainer = document.getElementById('calendar-container');
  if (calContainer && db) {
     let _calEvents = [];
     let _calAnns = [];
     
     const renderCal = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); 
        
        const monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const getCellClass = (day) => {
           const checkDate = (dstr) => {
              if(!dstr) return false;
              const d = new Date(dstr.replace(/\,/g,''));
              return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
           };
           
           let hasEvent = _calEvents.some(e => checkDate(e.date));
           let hasAnn = _calAnns.some(a => checkDate(a.date));
           
           if(hasEvent && hasAnn) return 'cell-both';
           if(hasEvent) return 'cell-event';
           if(hasAnn) return 'cell-announcement';
           return '';
        };

        let gridHtml = '';
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(d => gridHtml += `<div class="cal-day-header">${d}</div>`);
        
        for(let i=0; i<firstDay; i++) {
           gridHtml += `<div class="cal-cell empty"></div>`;
        }
        
        for(let i=1; i<=daysInMonth; i++) {
           gridHtml += `
             <div class="cal-cell ${getCellClass(i)}">
               <div class="cal-date-num">${i}</div>
             </div>
           `;
        }
        
        calContainer.innerHTML = `
          <div class="cal-inner-container">
            <div class="cal-header-row">
               <div class="legend-item left"><div class="legend-dot dot-event"></div> Event</div>
               <div class="cal-month-name">${monthNames[month]} ${year}</div>
               <div class="legend-item right"><div class="legend-dot dot-announcement"></div> Announcement</div>
            </div>
            <div class="cal-grid">
               ${gridHtml}
            </div>
          </div>
        `;
     };

     db.collection('events').onSnapshot(snap => {
        _calEvents = snap.docs.map(d => d.data());
        renderCal();
     });
     db.collection('announcements').onSnapshot(snap => {
        _calAnns = snap.docs.map(d => d.data());
        renderCal();
     });
     
     renderCal();
  }

  // 3. Upcoming Events (Slider)
  const eventsContainer = document.getElementById('events-list');
  if (eventsContainer && db) {
    db.collection('events').orderBy('createdAt','desc').limit(10).onSnapshot(snap => {
       const evs = snap.docs.map(d => d.data());
       if(evs.length === 0) {
         eventsContainer.innerHTML = '';
         return;
       }
       eventsContainer.innerHTML = evs.map((e, i) => `
         <div class="event-card ${i===0 ? 'active' : ''}" style="background-image: url('${e.image}');">
            <div class="event-overlay">
               <h3 class="event-title">${e.title}</h3>
               <div class="event-sub">${e.date}</div>
            </div>
         </div>
       `).join('');

       const dotsWrap = eventsContainer.parentElement.querySelector('.dots-wrap');
       if (dotsWrap) {
         dotsWrap.innerHTML = evs.map((_, i) => `<span class="dot ${i===0?'active':''}" style="width:8px;height:8px;border-radius:50%;background:#000;opacity:${i===0?1:0.4};"></span>`).join('');
       }
       
       // Slider Logic
       clearInterval(window._eventsInterval);
       let idx = 0;
       const cards = eventsContainer.querySelectorAll('.event-card');
       if(cards.length > 1) {
         window._eventsInterval = setInterval(() => {
           cards.forEach(c => c.classList.remove('active'));
           idx = (idx + 1) % cards.length;
           cards[idx].classList.add('active');
           const dots = eventsContainer.parentElement.querySelectorAll('.dot');
           if(dots.length) dots.forEach((d, i) => {
             d.classList.toggle('active', i === idx);
             d.style.opacity = (i === idx) ? '1' : '0.4';
           });
         }, 5000);
       }
    });
  }

  // 4. Highlights (Slider)
  const highContainer = document.getElementById('highlights-container');
  if (highContainer && db) {
     db.collection('highlights').orderBy('createdAt','desc').limit(10).onSnapshot(snap => {
        const hls = snap.docs.map(d => d.data());
        if(hls.length === 0) {
            highContainer.innerHTML = '';
            return;
        }
        
        // Render structure for new CSS
        highContainer.innerHTML = `
          <div class="image-slide"></div>
          <div class="dots-wrap" style="margin-top:auto; padding-bottom:4px;"></div>
        `;
        
        const slideEl = highContainer.querySelector('.image-slide');
        const dotsEl = highContainer.querySelector('.dots-wrap');
        
        let idx = 0;
        const setSlide = () => {
           const cur = hls[idx % hls.length];
           // Create a new box-frame for transition effect if desired, or just set bg
           // The CSS implies .image-slide has bg image, or .box-frame inside it
           // Let's use simple bg image on image-slide as per CSS transition
           slideEl.style.backgroundImage = `url('${cur.image}')`;
           
           if(dotsEl) {
             const activeIdx = idx % hls.length;
             dotsEl.innerHTML = hls.map((_, i) => `<span class="dot ${i===activeIdx?'active':''}" style="width:8px;height:8px;border-radius:50%;background:#000;opacity:${i===activeIdx?1:0.4};"></span>`).join('');
           }
           idx++;
        };
        setSlide();
        clearInterval(window._highInterval);
        window._highInterval = setInterval(setSlide, 5000);
     });
  }

  // 5. Facility Status (3x2 Grid)
  const facContainer = document.getElementById('facility-list');
  if (facContainer) {
     const getStatus = (val) => {
        if(!val) return { text: 'CLOSED', class: 'status-closed' };
        const v = String(val).toLowerCase();
        if(v.includes('break')) return { text: 'ON BREAK', class: 'status-break-fac' };
        if(v.includes('open')) return { text: 'OPEN', class: 'status-open' };
        return { text: 'CLOSED', class: 'status-closed' };
     };
     const renderFacilities = (fs) => {
       const items = [
         { name: 'Clinic', val: fs.clinic },
         { name: 'Library', val: fs.library },
         { name: 'Admin', val: fs.admin },
         { name: 'Registrar', val: fs.registrar },
         { name: 'Proware', val: fs.proware },
         { name: 'D.O', val: fs.do }
       ];
       facContainer.innerHTML = `
         <div class="facility-grid">
           ${items.map(item => {
             const st = getStatus(item.val);
             return `
             <div class="facility-item">
               <span class="facility-name">${item.name}</span>
               <span class="facility-status ${st.class}">${st.text}</span>
             </div>
             `;
           }).join('')}
         </div>
       `;
     };
     if (db) {
       try {
         db.collection('config').doc('facilityStatus').onSnapshot(snap => {
           const fs = snap.exists ? (snap.data() || {}) : {};
           renderFacilities(fs);
         });
       } catch {
         const fs = await fetchConfig('facilityStatus') || {};
         renderFacilities(fs);
       }
     }
  }

  // 6. Ticker
  const tickerEl = document.getElementById('ticker-text');
  if (tickerEl) {
    const t = await fetchConfig('ticker');
    tickerEl.textContent = (t && t.text) || 'Say hey flexi help to see the voice commands';
  }
}

// --- Admin Render Logic ---
function renderAdminAnnouncementsList(list) {
  return list.map(a => `
    <div class="announcement-item-admin">
       <div class="icon">${a.icon || '📢'}</div>
       <div class="text">
          <h3>${a.title}</h3>
          ${a.description ? `<p>${a.description}</p>` : ''}
          <p style="font-size:0.9rem; color:#334155;">${a.time} • ${a.date}</p>
       </div>
       <div class="admin-actions">
         <button class="btn-action ${a.pinned ? 'pinned' : ''}" data-action="pin" data-id="${a.id}" data-pinned="${!!a.pinned}">${a.pinned ? 'Unpin' : 'Pin'}</button>
         <button class="btn-save" data-action="del" data-id="${a.id}">Delete</button>
       </div>
    </div>
  `).join('');
}

function renderAdminEventsList(list) {
  return list.map(e => `
    <div class="event-item-admin">
       <img src="${e.image}" class="event-img" alt="${e.title}">
       <div class="event-info">
         <h3>${e.title}</h3>
         <p>${e.date}</p>
       </div>
       <button class="btn-delete" data-action="delete" data-id="${e.id}">Delete</button>
    </div>
  `).join('');
}

async function renderAdmin() {
  // Use Firebase configs instead of local storage
  const tickerInput = document.getElementById('ticker-input');
  if (tickerInput) {
    const t = await fetchConfig('ticker');
    tickerInput.value = (t && t.text) || '';
    const prevEl = document.getElementById('ticker-preview-text');
    if (prevEl) prevEl.textContent = tickerInput.value || 'Say hey flexi help to see the voice commands';
    tickerInput.addEventListener('input', () => {
      const p = document.getElementById('ticker-preview-text');
      if (p) p.textContent = tickerInput.value || '';
    });
  }

  // Legacy inputs - keep disabled or remove if not in HTML
  const annInput = document.getElementById('announcements-input');
  if (annInput) annInput.disabled = true;
  const eventsInput = document.getElementById('events-input');
  if (eventsInput) eventsInput.disabled = true;
  const scheduleInput = document.getElementById('schedule-input');
  if (scheduleInput) scheduleInput.disabled = true;
  const mediaType = document.getElementById('media-type');
  const mediaValue = document.getElementById('media-value');
  if (mediaType) mediaType.disabled = true;
  if (mediaValue) mediaValue.disabled = true;

  // Facility Status
  const clinicStatus = document.getElementById('clinic-status');
  const libraryStatus = document.getElementById('library-status');
  const adminStatus = document.getElementById('admin-status');
  const registrarStatus = document.getElementById('registrar-status');
  const prowareStatus = document.getElementById('proware-status');
  const doStatus = document.getElementById('do-status');

  const fsCfg = await fetchConfig('facilityStatus');
  if (clinicStatus) clinicStatus.value = (fsCfg && fsCfg.clinic) || 'Open';
  if (libraryStatus) libraryStatus.value = (fsCfg && fsCfg.library) || 'Open';
  if (adminStatus) adminStatus.value = (fsCfg && fsCfg.admin) || 'Open';
  if (registrarStatus) registrarStatus.value = (fsCfg && fsCfg.registrar) || 'Open';
  if (prowareStatus) prowareStatus.value = (fsCfg && fsCfg.proware) || 'Open';
  if (doStatus) doStatus.value = (fsCfg && fsCfg.do) || 'Open';


  // Lists
  const eventsAdmin = document.getElementById('events-admin-list');
  if (eventsAdmin) {
    const evsAll = await fetchEvents(50);
    eventsAdmin.innerHTML = renderAdminEventsList(evsAll);
  }
  const teachersAdmin = document.getElementById('teachers-admin-list');
  if (teachersAdmin) {
    const tchsAll = await fetchTeachers(50);
    teachersAdmin.innerHTML = tchsAll.map(s => `
      <div class="list-item"><h3>${s.name}</h3><p>${s.availability}</p></div>
    `).join('');
  }
  const scheduleAdmin = document.getElementById('schedule-admin-list');
  if (scheduleAdmin) {
    // Implement schedule fetching if needed, or remove if not used
    // Assuming schedule fetching is similar to others but we don't have fetchSchedule function yet?
    // Wait, renderDashboard uses db.collection('schedules')
    // Let's add fetchSchedules if not exists or use direct db call
    const db = getFirestoreDB();
    if(db) {
       const snap = await db.collection('schedules').orderBy('createdAt','desc').limit(20).get();
       const schs = snap.docs.map(d => d.data());
       scheduleAdmin.innerHTML = schs.map(s => `
         <div class="list-item"><h3>${s.title}</h3><p>${s.time} (${s.start}-${s.end})</p></div>
       `).join('');
    }
  }
  const roomsAdmin = document.getElementById('rooms-admin-list');
  if (roomsAdmin) {
    const rooms = await fetchRooms();
    roomsAdmin.innerHTML = rooms.map(r => `
      <div class="list-item"><h3>${r.name}</h3><p>${r.status}</p></div>
    `).join('');
  }
  const adminList = document.getElementById('announcements-admin-list');
  if (adminList) {
    const allAnns = await fetchAnnouncements(50);
    adminList.innerHTML = renderAdminAnnouncementsList(allAnns);
  }
  
  // Highlights/Media
  const mediaAdmin = document.getElementById('media-admin-list');
  if (mediaAdmin) {
      const hls = await fetchHighlights(50);
      mediaAdmin.innerHTML = hls.map(h => `
        <div class="list-item">
          <div style="width:60px; height:40px; background-image:url('${h.image}'); background-size:cover; border-radius:4px;"></div>
        </div>
      `).join('');
  }

  const highlightsGrid = document.getElementById('highlights-admin-list');
  if (highlightsGrid) {
      const hls = await fetchHighlights(50);
      const cnt = (hls || []).length;
      highlightsGrid.innerHTML = (hls || []).map(h => `
        <div class="list-item">
           <div style="width:100%; height:160px; background-image:url('${h.image}'); background-size:cover; background-position:center;"></div>
           <div style="display:flex; gap:8px; margin-top:6px; justify-content:center;">
             <button class="btn-save" data-action="replace" data-id="${h.id}">Replace</button>
             <button class="btn-save" style="background:#dc3545; ${cnt>8 ? '' : 'display:none;'}" data-action="delete" data-id="${h.id}">Delete</button>
           </div>
        </div>
      `).join('');
  }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
  // Check which page we are on
  if (document.getElementById('dashboard-view')) {
    renderDashboard();
    logInfo('dashboard_view', { path: 'dashboard.html' });
    setInterval(updateTime, 1000);
    updateTime();
    (async () => { const st = await checkFirestoreConnectivity(); updateDbIndicator(st.ok ? 'Connected to Firestore' : `Firestore error: ${st.error}`, st.ok); })();
    
    // PIR Sensor Listener
    try {
      const db = getFirestoreDB();
      if (db) {
        db.collection('sensors').doc('pir').onSnapshot(doc => {
          if (doc.exists) {
            const data = doc.data();
            // motion: true -> Turn ON (hidePowerOff)
            // motion: false -> Turn OFF (showPowerOff)
            if (data && typeof data.motion === 'boolean') {
              if (data.motion) {
                hidePowerOff();
              } else {
                showPowerOff();
              }
            }
          }
        }, err => {
          console.warn('PIR listener error', err);
        });
      }
    } catch (e) {
      console.warn('Failed to attach PIR listener', e);
    }

    const closeBtn = document.getElementById('voice-close');
    if (closeBtn) closeBtn.addEventListener('click', hideOverlay);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recog = null;
    let backoff = 600;
    let listening = false;
    let sessionDeadline = 0;
    let permissionStatus = 'unknown';
    let micStream = null;
    let voiceBuf = '';
    let voiceTimer = null;
    let lastCmdTs = 0;
    const startListening = async () => {
      if (!SR) {
        showOverlay('Voice Not Supported', '<div>Your browser does not support voice recognition.</div>' + commandsHTML());
        return;
      }
      if (!micStream && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          try { console.log('Requesting microphone access'); } catch {}
          micStream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } });
          permissionStatus = 'granted';
          try { console.log('Microphone access granted'); } catch {}
          // Ensure tracks are kept alive
          micStream.getAudioTracks().forEach(track => {
              track.onended = () => { console.log('Audio track ended'); micStream = null; };
          });
        } catch (e) {
          permissionStatus = 'denied';
          console.warn('Microphone access blocked', e);
          showModal('MICROPHONE PERMISSION', '<div>Please allow microphone access to use voice commands.</div>');
          listening = false;
          return;
        }
      }
      if (!recog) {
        recog = new SR();
        recog.lang = 'en-US';
        recog.continuous = true;
        recog.interimResults = true;
        recog.maxAlternatives = 3;
        // try { recog.onstart = () => { try { console.log('SpeechRecognition start'); } catch {} }; } catch {}
        // try { recog.onsoundstart = () => { try { console.log('Sound start'); } catch {} }; } catch {}
        // try { recog.onsoundend = () => { try { console.log('Sound end'); } catch {} }; } catch {}
        // try { recog.onspeechstart = () => { try { console.log('Speech start'); } catch {} }; } catch {}
        // try { recog.onspeechend = () => { try { console.log('Speech end'); } catch {} }; } catch {}
    // If Whisper is available, prefer it
    const hasWhisperSupport = () => {
      try { return !!(window.WhisperWeb && typeof WhisperWeb.init === 'function' && typeof WhisperWeb.transcribe === 'function'); } catch { return false; }
    };
    async function startListeningWhisper() {
      try {
        const modelUrl = (window.WHISPER_MODEL_URL || 'models/ggml-base.en.bin');
        await WhisperWeb.init({ modelUrl, useGPU: !!window.WHISPER_USE_GPU });
      } catch (e) {
        console.warn('Whisper init failed, falling back to native STT', e);
        return false;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        let buf = [];
        processor.onaudioprocess = async (ev) => {
          const ch = ev.inputBuffer.getChannelData(0);
          buf.push(Float32Array.from(ch));
          const seconds = buf.reduce((s, a) => s + a.length, 0) / 16000;
          if (seconds >= 1.2) {
            const merged = new Float32Array(buf.reduce((n, a) => n + a.length, 0));
            let off = 0; for (const a of buf) { merged.set(a, off); off += a.length; }
            buf = [];
            try {
              const text = await WhisperWeb.transcribe(merged);
              try { console.log('Mic heard (whisper):', text); } catch {}
              const full = normalizeText(text || '');
              if (!full) return;
              if (Date.now() - lastCmdTs < 1200 && window._lastCmdStr === full) return;
              lastCmdTs = Date.now();
              window._lastCmdStr = full;
              window._lastCmdTs = lastCmdTs;
              const guess = classifyIntent(full);
              if (guess && guess.intent) await handleVoice(full);
            } catch (e) { console.warn('Whisper transcribe error', e); }
          }
        };
        source.connect(processor);
        processor.connect(ctx.destination);
        return true;
      } catch (e) {
        console.warn('Audio capture for Whisper failed', e);
        return false;
      }
    }
    if (hasWhisperSupport()) {
      const ok = await startListeningWhisper();
      if (ok) {
        // Do not set native recognizer when Whisper is active
        recog = null;
      }
    }
    if (!recog) return; // Whisper active; skip native onresult
    recog.onresult = async (e) => {
          let interimTranscript = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              try { console.log('Mic heard (final):', transcript); } catch {}
              voiceBuf += transcript + ' ';
            } else {
              try { console.log('Mic heard (interim):', transcript); } catch {}
              interimTranscript += transcript;
            }
          }
          
          const fullInput = normalizeText(voiceBuf + interimTranscript);
          const kw = ['commands','command','announcement','announcements','event','events','bends','calendar','date','day','year','month','next','previous','prev','back','close','clause','claus','cloze','clothes','glose','exit','dismiss','shut','show','highlight','highlights','off','on','turnoff','turnon','poweroff','poweron','shutdown','screenoff','screenon','teacher','teachers','availability','faculty','open','schedule','today','tomorrow','week','help','helf','helt','halp','hep','assist','assistance'];
          const hasKw = kw.some(k => {
            if (['exit','dismiss','shut'].includes(k)) return fullInput.includes(k); // strict
            return fuzzyHasKeyword(fullInput, k) || fullInput.includes('the next') || fullInput.includes('the previous');
          }) || hasTagQuery(fullInput);
          if (hasKw) {
            if (Date.now() - lastCmdTs < 1200 && window._lastCmdStr === fullInput) {
              voiceBuf = '';
              return;
            }
            const alts = [];
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const r = e.results[i];
              for (let j = 0; j < Math.min(r.length, 3); j++) {
                try { console.log('Mic alternative:', r[j].transcript); } catch {}
                alts.push(normalizeText((voiceBuf + ' ' + r[j].transcript).trim()));
              }
            }
            let bestText = fullInput;
            let bestConf = 0;
            const candidates = [fullInput].concat(alts);
            for (const cand of candidates) {
              const guess = classifyIntent(cand);
              const conf = guess && guess.confidence || 0;
              if (conf > bestConf) { bestConf = conf; bestText = cand; }
            }
            lastCmdTs = Date.now();
            window._lastCmdStr = bestText;
            window._lastCmdTs = lastCmdTs;
            voiceBuf = '';
            try { await handleVoice(bestText); } catch (err) { console.error('Voice command error:', err); }
            return;
          }
          if (voiceBuf.length > 200) voiceBuf = voiceBuf.slice(-100);
        };
        recog.onend = () => {
          // If we have permission, restart immediately. 
          // Browser speech engines often disconnect after silence or short bursts.
          if (listening && permissionStatus === 'granted') {
             // Reset internal state to avoid stuck buffers
             voiceBuf = ''; 
             // try { console.log('SpeechRecognition end, restarting'); } catch {}
             setTimeout(() => { 
                try { recog.start(); } catch (err) { console.log('Resume error', err); } 
             }, 10); // Shorter restart delay
          }
        };
        recog.onerror = (e) => { 
          console.warn('SpeechRecognition error', e);
          if (String(e && e.error || '').toLowerCase().includes('not-allowed')) {
            permissionStatus = 'denied';
            listening = false;
          } else if (e.error === 'no-speech' || e.error === 'network') {
             // Common transient errors, ignore and let onend restart
          }
        };
      }
      listening = true;
      backoff = 600;
      sessionDeadline = Date.now() + (24 * 60 * 60 * 1000);
      voiceBuf = '';
      try { recog.start(); await logInfo('voice_start', {}); } catch {}
    };
    try { await startListening(); } catch {}
    setInterval(() => {
      if (!listening && SR && recog && permissionStatus === 'granted') {
        listening = true;
        try { recog.start(); } catch {}
      }
    }, 5000);

    const mclose = document.getElementById('modal-close');
    if (mclose) mclose.addEventListener('click', hideModal);
    const annHead = document.getElementById('announcements-header');
    const eventsHead = document.getElementById('events-header');
    const teachersHead = document.getElementById('teachers-header');
    const calHead = document.getElementById('calendar-header');
    if (annHead) annHead.addEventListener('click', async () => {
      const anns = await fetchAnnouncements(200);
      showAnnouncementsPaged(anns, 0, null);
    });
    if (eventsHead) eventsHead.addEventListener('click', async () => {
      const evs = await fetchEvents(200);
      showEventsPaged(evs, 0, null);
    });
    if (teachersHead) teachersHead.addEventListener('click', async () => {
      const tchs = await fetchTeachers(200);
      const html = tchs.map(s => `<div style="padding:6px 8px;"><b>${s.name}</b><div style="color:#4a5568; font-size:0.85rem;">${s.availability}</div></div>`).join('');
      showModal('Teachers Availability', html);
    });
    if (calHead) calHead.addEventListener('click', async () => {
      const anns = await fetchAnnouncements(200);
      const evs = await fetchEvents(200);
      const html = `<div><div style="font-weight:bold; margin-bottom:6px;">Events</div>${evs.map(e => `<div>${e.title} — ${e.date}</div>`).join('')}<div style="font-weight:bold; margin:10px 0 6px;">Announcements</div>${anns.map(a => `<div>${a.title} — ${a.time} • ${a.date}</div>`).join('')}</div>`;
      showModal('Calendar & Highlights', html);
    });
  }
  
  if (document.getElementById('admin-view')) {
    renderAdmin();

    // Announcements
    const annAddBtn = document.getElementById('ann-add-btn');
    if (annAddBtn) annAddBtn.addEventListener('click', async () => {
      const title = document.getElementById('ann-title').value.trim();
      const desc = (document.getElementById('ann-desc') && document.getElementById('ann-desc').value.trim()) || '';
      const date = document.getElementById('ann-date').value.trim();
      const time = document.getElementById('ann-time').value.trim();
      const icon = document.getElementById('ann-icon').value;
      if (!title || !date || !time) return;
      
      const db = getFirestoreDB();
      const doc = { title, description: desc, date, time, icon, createdAt: new Date().toISOString(), pinned: false };
      if (db) {
        try { await db.collection('announcements').add(doc); } catch {}
      }
      await logInfo('announcement_add', { title, date, time });

      if (document.getElementById('announcements-admin-list')) {
        const allAnns = await fetchAnnouncements(50);
        document.getElementById('announcements-admin-list').innerHTML = renderAdminAnnouncementsList(allAnns);
      }
      document.getElementById('ann-title').value = '';
      if(document.getElementById('ann-desc')) document.getElementById('ann-desc').value = '';
      document.getElementById('ann-date').value = '';
      document.getElementById('ann-time').value = '';
    });
    
    const annSaveBtn = document.getElementById('ann-save-btn');
    if (annSaveBtn) annSaveBtn.addEventListener('click', async () => {
       const allAnns = await fetchAnnouncements(50);
       const container = document.getElementById('announcements-admin-list');
       if(container) container.innerHTML = renderAdminAnnouncementsList(allAnns);
       alert('Changes saved/synced with database.');
    });
    
    // Admin announcement actions (pin/delete)
    const adminList = document.getElementById('announcements-admin-list');
    if (adminList) {
      adminList.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        const act = btn.dataset.action;
        const isPinned = btn.dataset.pinned === 'true';
        if (!id || !act) return;
        if (act === 'del') await deleteAnnouncement(id);
        if (act === 'pin') await pinAnnouncement(id, !isPinned);
        
        const allAnns = await fetchAnnouncements(50);
        adminList.innerHTML = renderAdminAnnouncementsList(allAnns);
      });
    }

    // Events
    const eventAddBtn = document.getElementById('event-add-btn');
    if (eventAddBtn) eventAddBtn.addEventListener('click', async () => {
      const title = document.getElementById('event-title').value.trim();
      const date = document.getElementById('event-date').value.trim();
      const fileEl = document.getElementById('event-img-upload');
      const file = fileEl && fileEl.files && fileEl.files[0];
      if (!title || !date || !file) return;
      const url = await compressImageToDataURL(file);
      if (!url) return;
      await addEvent(title, date, url);
      if (document.getElementById('events-admin-list')) {
        const evsAll = await fetchEvents(50);
        document.getElementById('events-admin-list').innerHTML = renderAdminEventsList(evsAll);
      }
      document.getElementById('event-title').value = '';
      document.getElementById('event-date').value = '';
      if (fileEl) fileEl.value = '';
    });

    const eventsSaveBtn = document.getElementById('events-save-btn');
    if (eventsSaveBtn) eventsSaveBtn.addEventListener('click', async () => {
       const evsAll = await fetchEvents(50);
       const container = document.getElementById('events-admin-list');
       if(container) container.innerHTML = renderAdminEventsList(evsAll);
       alert('Changes saved/synced with database.');
    });

    const eventsList = document.getElementById('events-admin-list');
    if (eventsList) {
      eventsList.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        const act = btn.dataset.action;
        if (!id || !act) return;
        if (act === 'delete') await deleteEvent(id);
        
        const evsAll = await fetchEvents(50);
        eventsList.innerHTML = renderAdminEventsList(evsAll);
      });
    }

    // Highlights
    const highlightAddBtn = document.getElementById('highlight-add-btn');
    if (highlightAddBtn) highlightAddBtn.addEventListener('click', async () => {
      const fileEl = document.getElementById('highlight-img-upload');
      const file = fileEl && fileEl.files && fileEl.files[0];
      if (!file) return;
      const existing = await fetchHighlights(50);
      if ((existing || []).length >= 8) {
        alert('Only 8 highlights allowed. Use Replace to update or Delete extras.');
        if (fileEl) fileEl.value = '';
        return;
      }
      const url = await compressImageToDataURL(file);
      if (!url) return;
      await addHighlight(url);
      if (document.getElementById('highlights-admin-list')) {
        const hls = await fetchHighlights(50);
        const cnt = (hls || []).length;
        document.getElementById('highlights-admin-list').innerHTML = (hls || []).map(h => `
          <div class="list-item">
             <div style="width:100%; height:160px; background-image:url('${h.image}'); background-size:cover; background-position:center;"></div>
             <div style="display:flex; gap:8px; margin-top:6px; justify-content:center;">
               <button class="btn-save" data-action="replace" data-id="${h.id}">Replace</button>
               <button class="btn-save" style="background:#dc3545; ${cnt>8 ? '' : 'display:none;'}" data-action="delete" data-id="${h.id}">Delete</button>
             </div>
          </div>
        `).join('');
      }
      if (fileEl) fileEl.value = '';
    });

    // Highlights list actions (replace/delete)
    const highlightsList = document.getElementById('highlights-admin-list');
    if (highlightsList) {
      highlightsList.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        const act = btn.dataset.action;
        if (!id || !act) return;
        if (act === 'delete') {
          await deleteHighlight(id);
        }
        if (act === 'replace') {
          const picker = document.createElement('input');
          picker.type = 'file';
          picker.accept = 'image/*';
          picker.onchange = async () => {
            const file = picker.files && picker.files[0];
            if (!file) return;
            const url = await compressImageToDataURL(file);
            if (!url) return;
            await replaceHighlight(id, url);
            const hls = await fetchHighlights(50);
            const cnt = (hls || []).length;
            highlightsList.innerHTML = (hls || []).map(h => `
              <div class="list-item">
                 <div style="width:100%; height:160px; background-image:url('${h.image}'); background-size:cover; background-position:center;"></div>
                 <div style="display:flex; gap:8px; margin-top:6px; justify-content:center;">
                   <button class="btn-save" data-action="replace" data-id="${h.id}">Replace</button>
                   <button class="btn-save" style="background:#dc3545; ${cnt>8 ? '' : 'display:none;'}" data-action="delete" data-id="${h.id}">Delete</button>
                 </div>
              </div>
            `).join('');
          };
          picker.click();
        }
        // After delete, refresh list
        if (act === 'delete') {
          const hls = await fetchHighlights(50);
          const cnt = (hls || []).length;
          highlightsList.innerHTML = (hls || []).map(h => `
            <div class="list-item">
               <div style="width:100%; height:160px; background-image:url('${h.image}'); background-size:cover; background-position:center;"></div>
               <div style="display:flex; gap:8px; margin-top:6px; justify-content:center;">
                 <button class="btn-save" data-action="replace" data-id="${h.id}">Replace</button>
                 <button class="btn-save" style="background:#dc3545; ${cnt>8 ? '' : 'display:none;'}" data-action="delete" data-id="${h.id}">Delete</button>
               </div>
            </div>
          `).join('');
        }
      });
    }
    // Schedule
    const schAddBtn = document.getElementById('sch-add-btn');
    if (schAddBtn) schAddBtn.addEventListener('click', async () => {
       const title = document.getElementById('sch-title').value.trim();
       const start = document.getElementById('sch-start').value;
       const end = document.getElementById('sch-end').value;
       if(!title || !start || !end) return;
       await addSchedule(title, start, end);
       if (document.getElementById('schedule-admin-list')) {
         const schs = await fetchSchedules(50);
         document.getElementById('schedule-admin-list').innerHTML = schs.map(s => `
           <div class="list-item"><h3>${s.title}</h3><p>${s.time}</p></div>
         `).join('');
       }
       document.getElementById('sch-title').value = '';
       document.getElementById('sch-start').value = '';
       document.getElementById('sch-end').value = '';
    });

    // Rooms
    const roomAddBtn = document.getElementById('room-add-btn');
    if (roomAddBtn) roomAddBtn.addEventListener('click', async () => {
      const name = document.getElementById('room-name').value.trim();
      const status = document.getElementById('room-status').value.trim();
      if (!name || !status) return;
      await addRoom(name, status);
      if (document.getElementById('rooms-admin-list')) {
        const rooms = await fetchRooms();
        document.getElementById('rooms-admin-list').innerHTML = rooms.map(r => `
          <div class="list-item"><h3>${r.name}</h3><p>${r.status}</p></div>
        `).join('');
      }
      document.getElementById('room-name').value = '';
    });

    // Facility Save
    const facilitySaveBtn = document.getElementById('facility-save-btn');
    if (facilitySaveBtn) facilitySaveBtn.addEventListener('click', async () => {
      try {
        const newData = {
          facilityStatus: {
            clinic: document.getElementById('clinic-status').value,
            library: document.getElementById('library-status').value,
            admin: document.getElementById('admin-status').value,
            registrar: document.getElementById('registrar-status').value,
            proware: document.getElementById('proware-status').value,
            do: document.getElementById('do-status').value
          }
        };
        await saveConfigDocs(newData);
        alert('Facility Status Saved');
      } catch (e) {
        alert('Invalid data');
      }
    });

    // Ticker Save
    const tickerSaveBtn = document.getElementById('ticker-save-btn');
    if (tickerSaveBtn) tickerSaveBtn.addEventListener('click', async () => {
      try {
        const newData = {
          ticker: document.getElementById('ticker-input').value
        };
        await saveConfigDocs(newData);
        alert('Ticker Saved');
      } catch (e) {
        alert('Invalid data');
      }
    });

    const statusEl = document.getElementById('db-status');
    if (statusEl) {
      const st = await checkFirestoreConnectivity();
      statusEl.textContent = st.ok ? 'Connected to Firestore' : `Firestore error: ${st.error}`;
      statusEl.style.color = st.ok ? '#2f855a' : '#c53030';
    }
  }
});
