// --- Mock Data Initialization ---
const defaultData = {
  announcements: [
    { title: "Flag Ceremony", date: "Feb 20, 2026", time: "7:00 AM" },
    { title: "Student Council Meeting", date: "Feb 20, 2026", time: "10:00 AM" },
    { title: "Library Closed", date: "Feb 21, 2026", time: "All Day" },
    { title: "Extra Announcement", date: "Feb 22, 2026", time: "1:00 PM" }
  ],
  events: [
    { title: "Science Fair", date: "March 1, 2026", image: "https://images.unsplash.com/photo-1564939558297-fc80cd1102f3?auto=format&fit=crop&w=600&q=80" },
    { title: "Sports Fest", date: "March 5, 2026", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80" }
  ],
  schedules: [
    { title: "Math Class", time: "08:00 AM - 09:30 AM" },
    { title: "Recess", time: "09:30 AM - 10:00 AM" },
    { title: "Physics Lab", time: "10:00 AM - 11:30 AM" }
  ],
  media: {
    type: "qr",
    value: "Scan for Updates"
  },
  officeInfo: {
    registrarHours: "8:00 AM - 5:00 PM",
    clinicStatus: "Open",
    guidanceAvailability: "Available"
  },
  facilityStatus: {
    library: "Open",
    canteen: "Open",
    laboratory: "Available"
  },
  roomAvailability: [
    { name: "Room 101", status: "Free" },
    { name: "Room 102", status: "Occupied" }
  ],
  ticker: "Welcome to Flexi Kiosk System. Please check announcements regularly.  |  Reminder: Submit permission slips by Friday."
};

// --- Storage Helper ---
function getData() {
  const stored = localStorage.getItem('flexiData');
  return stored ? JSON.parse(stored) : defaultData;
}

function saveData(data) {
  localStorage.setItem('flexiData', JSON.stringify(data));
}

function getFirestoreDB() {
  try {
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) return null;
    if (!window._firebaseApp) {
      window._firebaseApp = firebase.initializeApp(window.FIREBASE_CONFIG);
      window._db = firebase.firestore();
    }
    return window._db || null;
  } catch {
    return null;
  }
}


async function fetchAnnouncements(limitCount = 3) {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const snap = await db.collection('announcements').orderBy('createdAt', 'desc').limit(limitCount).get();
    const rows = snap.docs.map(d => d.data());
    if (!rows || rows.length === 0) throw new Error('empty');
    return rows;
  } catch {
    return getData().announcements.slice(0, limitCount);
  }
}

async function addAnnouncement(title, date, time) {
  const db = getFirestoreDB();
  const doc = { title, date, time, createdAt: new Date().toISOString() };
  if (db) {
    try { await db.collection('announcements').add(doc); } catch {}
  }
  const data = getData();
  data.announcements.unshift({ title, date, time });
  saveData(data);
}

async function fetchEvents(limitCount = 1) {
  try {
    const db = getFirestoreDB();
    if (!db) throw new Error('no-db');
    const snap = await db.collection('events').orderBy('createdAt', 'desc').limit(limitCount).get();
    const rows = snap.docs.map(d => d.data());
    if (!rows || rows.length === 0) throw new Error('empty');
    return rows;
  } catch {
    return getData().events.slice(0, limitCount);
  }
}

async function addEvent(title, date, image) {
  const db = getFirestoreDB();
  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const doc = { title, date: displayDate, image, createdAt: new Date().toISOString() };
  if (db) {
    try { await db.collection('events').add(doc); } catch {}
  }
  const data = getData();
  data.events.unshift({ title, date: displayDate, image });
  saveData(data);
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
    return getData().schedules.slice(0, limitCount);
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
    const data = getData();
    data.schedules.unshift({ title, time });
    saveData(data);
    return;
  }
  await db.collection('schedules').add({ title, time, createdAt: new Date().toISOString() });
}

async function saveConfigDocs(payload) {
  const db = getFirestoreDB();
  if (db) {
    try {
      await db.collection('config').doc('ticker').set({ text: payload.ticker });
      await db.collection('config').doc('media').set(payload.media);
      await db.collection('config').doc('officeInfo').set(payload.officeInfo);
      await db.collection('config').doc('facilityStatus').set(payload.facilityStatus);
    } catch {}
  }
  const current = getData();
  saveData({ ...current, ...payload });
}

async function addRoom(name, status) {
  const db = getFirestoreDB();
  if (!db) {
    const data = getData();
    data.roomAvailability.unshift({ name, status });
    saveData(data);
    return;
  }
  await db.collection('rooms').add({ name, status, createdAt: new Date().toISOString() });
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
    return getData().roomAvailability;
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
    const data = getData();
    if (name === 'ticker') return { text: data.ticker };
    if (name === 'media') return data.media;
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

function normalizeText(s) {
  return (s || '').toLowerCase().replace(/[\.,!?]/g, '').trim();
}

function commandsHTML() {
  const cmds = [
    'Hey Flexi, is the library open?',
    'Hey Flexi, registrar office hours',
    'Hey Flexi, clinic status',
    'Hey Flexi, guidance office availability',
    'Hey Flexi, show facility status',
    'Hey Flexi, room availability',
    'Hey Flexi, show free rooms',
    'Hey Flexi, full announcement list',
    'Hey Flexi, show schedule',
    'Hey Flexi, show upcoming events today',
    'Hey Flexi, show upcoming events tomorrow',
    'Hey Flexi, show upcoming events this week',
    'Hey Flexi, show events on January 25',
    'Hey Flexi, show events from Jan 20 to Jan 25',
    'Hey Flexi, show QR code'
  ];
  return '<div>' + cmds.map(c => `<div>• ${c}</div>`).join('') + '</div>';
}

function parseDate(text) {
  const now = new Date();
  const n = normalizeText(text);
  if (n.includes('today')) return { from: new Date(now.setHours(0,0,0,0)), to: new Date(now.setHours(23,59,59,999)) };
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
  const range = n.match(/from\s+([a-z]+\s+\d{1,2})(?:\s*(\d{4}))?\s+to\s+([a-z]+\s+\d{1,2})(?:\s*(\d{4}))?/);
  if (range) {
    const parsePart = (p, y) => parseDate(p + ' ' + (y || ''));
    const a = parsePart(range[1], range[2]);
    const b = parsePart(range[3], range[4]);
    if (a && b) return { from: a.from, to: b.to };
  }
  return null;
}

async function handleVoice(text) {
  const q = normalizeText(text);
  const data = getData();
  const prefix = 'hey flexi';
  const t = q.startsWith(prefix) ? q.replace(prefix, '').trim() : q;
  if (t === 'help' || t.includes('commands') || t.includes('what can you do')) {
    return showOverlay('Voice Commands', commandsHTML());
  }

  if (/^(show|open)\s+(office|office information)/.test(t) || t.includes('registrar') || t.includes('clinic') || t.includes('guidance')) {
    const off = await fetchConfig('officeInfo') || data.officeInfo;
    return showOverlay('Office Information', `
      <div><b>Registrar Hours:</b> ${off.registrarHours}</div>
      <div><b>Clinic Status:</b> ${off.clinicStatus}</div>
      <div><b>Guidance Availability:</b> ${off.guidanceAvailability}</div>
    `);
  }

  if (t.includes('library') || t.includes('canteen') || t.includes('laboratory') || t.includes('facility')) {
    const fs = await fetchConfig('facilityStatus') || data.facilityStatus;
    return showOverlay('Facility Status', `
      <div><b>Library:</b> ${fs.library}</div>
      <div><b>Canteen:</b> ${fs.canteen}</div>
      <div><b>Laboratory:</b> ${fs.laboratory}</div>
    `);
  }

  if (t.includes('room')) {
    const rooms = await fetchRooms();
    const free = rooms.filter(r => normalizeText(r.status) === 'free').map(r => r.name).slice(0,6);
    const occ = rooms.filter(r => normalizeText(r.status) === 'occupied').map(r => r.name).slice(0,6);
    return showOverlay('Room Availability', `
      <div><b>Free:</b> ${free.join(', ') || 'None'}</div>
      <div><b>Occupied:</b> ${occ.join(', ') || 'None'}</div>
    `);
  }

  if (t.includes('full announcement') || t.includes('show announcements') || t.includes('announcements list') || t.includes('announcement')) {
    const anns = await fetchAnnouncements(50);
    return showOverlay('Announcements', anns.slice(0,8).map(a => `<div><b>${a.title}</b> — ${a.time} • ${a.date}</div>`).join(''));
  }

  if (t.includes('schedule') || t.includes('daily schedule') || t.includes('weekly schedule')) {
    const schs = await fetchSchedules(50);
    return showOverlay('Daily Schedule', schs.slice(0,8).map(s => `<div><b>${s.title}</b> — ${s.time}</div>`).join(''));
  }

  if (t.includes('event')) {
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
    if (evs.length === 0) {
      const fallback = evsAll.slice(0,6);
      if (fallback.length === 0) return showOverlay('Upcoming Events', '<div>No events found.</div>');
      return showOverlay('Upcoming Events', fallback.map(e => `<div><b>${e.title}</b> — ${e.date}</div>`).join(''));
    }
    return showOverlay('Upcoming Events', evs.slice(0,6).map(e => `<div><b>${e.title}</b> — ${e.date}</div>`).join(''));
  }

  if (t.includes('qr')) {
    const mediaCfg = await fetchConfig('media') || data.media;
    const label = mediaCfg.value || 'FlexiSystem';
    return showOverlay('QR Code', `
      <div style="text-align:center">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(label)}" class="qr-code" alt="QR">
        <div style="margin-top:8px; font-weight:bold;">${label}</div>
      </div>
    `);
  }

  return showOverlay('Voice Commands', commandsHTML());
}
// --- Dashboard Render Logic ---
async function renderDashboard() {
  const data = getData();
  const annContainer = document.getElementById('announcements-list');
  if (annContainer) {
    const anns = await fetchAnnouncements(3);
    annContainer.innerHTML = anns.map(a => `
      <div class="list-item">
        <h3>${a.title}</h3>
        <p>${a.time} • ${a.date}</p>
      </div>
    `).join('');
  }

  // Render Upcoming Events
  const eventsContainer = document.getElementById('events-list');
  if (eventsContainer) {
    const evs = await fetchEvents(1);
    eventsContainer.innerHTML = evs.map(e => `
      <div class="event-card">
        <div style="display:flex; justify-content:space-between;">
          <b>${e.title}</b>
          <span style="color:#666">${e.date}</span>
        </div>
        <div class="event-img" style="background-image: url('${e.image}')"></div>
      </div>
    `).join('');
  }

  // Render Schedule
  const scheduleContainer = document.getElementById('schedule-list');
  if (scheduleContainer) {
    const schs = await fetchSchedules(2);
    scheduleContainer.innerHTML = schs.map(s => `
      <div class="list-item" style="border-left-color: var(--primary-green);">
        <h3>${s.title}</h3>
        <p>${s.time}</p>
      </div>
    `).join('');
  }

  // Render Media/Highlight
  const mediaContainer = document.getElementById('media-content');
  if (mediaContainer) {
    const mediaCfg = await fetchConfig('media');
    const mediaData = mediaCfg || data.media;
    if (mediaData.type === 'qr') {
      mediaContainer.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mediaData.value || 'FlexiSystem')}" class="qr-code" alt="QR">
        <p style="margin-top:10px; font-weight:bold;">${mediaData.value}</p>
      `;
    } else if (mediaData.type === 'quote') {
      mediaContainer.innerHTML = `
        <div style="font-size:1.2rem; font-weight:bold;">“${mediaData.value}”</div>
      `;
    } else {
      mediaContainer.innerHTML = `
        <div style="width:100%; height:100%; background-image:url('${mediaData.value}'); background-size:cover; background-position:center; border-radius:8px;"></div>
      `;
    }
  }

  // Render Ticker
  const tickerEl = document.getElementById('ticker-text');
  if (tickerEl) {
    const t = await fetchConfig('ticker');
    tickerEl.textContent = (t && t.text) || data.ticker;
  }
}

// --- Admin Render Logic ---
async function renderAdmin() {
  const data = getData();
  const tickerInput = document.getElementById('ticker-input');
  if (tickerInput) tickerInput.value = data.ticker;
  const annInput = document.getElementById('announcements-input');
  if (annInput) annInput.value = JSON.stringify(data.announcements, null, 2);
  const eventsInput = document.getElementById('events-input');
  if (eventsInput) eventsInput.value = JSON.stringify(data.events, null, 2);
  const scheduleInput = document.getElementById('schedule-input');
  if (scheduleInput) scheduleInput.value = JSON.stringify(data.schedules, null, 2);
  const mediaType = document.getElementById('media-type');
  const mediaValue = document.getElementById('media-value');
  if (mediaType) mediaType.value = data.media.type;
  if (mediaValue) mediaValue.value = data.media.value;
  const registrarHours = document.getElementById('registrar-hours');
  const clinicStatus = document.getElementById('clinic-status');
  const guidanceAvailability = document.getElementById('guidance-availability');
  if (registrarHours) registrarHours.value = data.officeInfo.registrarHours;
  if (clinicStatus) clinicStatus.value = data.officeInfo.clinicStatus;
  if (guidanceAvailability) guidanceAvailability.value = data.officeInfo.guidanceAvailability;
  const libraryStatus = document.getElementById('library-status');
  const canteenStatus = document.getElementById('canteen-status');
  const laboratoryStatus = document.getElementById('laboratory-status');
  if (libraryStatus) libraryStatus.value = data.facilityStatus.library;
  if (canteenStatus) canteenStatus.value = data.facilityStatus.canteen;
  if (laboratoryStatus) laboratoryStatus.value = data.facilityStatus.laboratory;
  const eventsAdmin = document.getElementById('events-admin-list');
  if (eventsAdmin) {
    const evsAll = await fetchEvents(50);
    eventsAdmin.innerHTML = evsAll.map(e => `
      <div class="list-item"><h3>${e.title}</h3><p>${e.date}</p></div>
    `).join('');
  }
  const scheduleAdmin = document.getElementById('schedule-admin-list');
  if (scheduleAdmin) {
    const schAll = await fetchSchedules(50);
    scheduleAdmin.innerHTML = schAll.map(s => `
      <div class="list-item"><h3>${s.title}</h3><p>${s.time}</p></div>
    `).join('');
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
    adminList.innerHTML = allAnns.map(a => `
      <div class="list-item"><h3>${a.title}</h3><p>${a.time} • ${a.date}</p></div>
    `).join('');
  }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  // Check which page we are on
  if (document.getElementById('dashboard-view')) {
    renderDashboard();
    setInterval(updateTime, 1000);
    updateTime();
    const closeBtn = document.getElementById('voice-close');
    if (closeBtn) closeBtn.addEventListener('click', hideOverlay);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recog = null;
    let backoff = 600;
    let listening = false;
    let sessionDeadline = 0;
    const mic = document.getElementById('voice-mic');
    let voiceBuf = '';
    let voiceTimer = null;
    const startListening = async () => {
      if (!mic) return;
      if (!SR) {
        showOverlay('Voice Not Supported', '<div>Your browser does not support voice recognition.</div>' + commandsHTML());
        return;
      }
      if (!recog) {
        recog = new SR();
        recog.lang = 'en-US';
        recog.continuous = true;
        recog.interimResults = true;
        recog.maxAlternatives = 1;
        recog.onresult = async (e) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const tx = e.results[i][0].transcript;
            voiceBuf += (tx + ' ');
          }
          const normBuf = normalizeText(voiceBuf);
          if (normBuf.includes('hey flexi')) {
            const hasCmd = ['library','registrar','clinic','guidance','facility','room','announcement','schedule','event','qr','show','open','commands','help']
              .some(k => normBuf.includes(k));
            clearTimeout(voiceTimer);
            voiceTimer = setTimeout(async () => {
              await handleVoice(voiceBuf);
              voiceBuf = '';
              try { recog.stop(); } catch {}
              listening = false;
            }, hasCmd ? 300 : 1200);
          }
        };
        recog.onend = () => {
          if (listening && Date.now() < sessionDeadline) {
            setTimeout(() => { try { recog.start(); } catch {} }, 400);
          } else {
            listening = false;
          }
        };
        recog.onerror = () => { showOverlay('Voice Control', '<div>Microphone error. Please check browser permissions.</div>'); };
      }
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (e) {
        showOverlay('Microphone Blocked', '<div>Please allow microphone access in browser settings, then click the mic again.</div>' + commandsHTML());
      }
      listening = true;
      backoff = 600;
      sessionDeadline = Date.now() + 15000;
      voiceBuf = '';
      try { recog.start(); showOverlay('Voice Commands', commandsHTML() + '<div style="margin-top:8px; color:#2d3748;">Listening… say “Hey Flexi …”</div>'); } catch {}
    };
    if (mic) mic.addEventListener('click', startListening);
  }
  
  if (document.getElementById('admin-view')) {
    renderAdmin();
    const annAddBtn = document.getElementById('ann-add-btn');
    if (annAddBtn) annAddBtn.addEventListener('click', async () => {
      const title = document.getElementById('ann-title').value.trim();
      const date = document.getElementById('ann-date').value.trim();
      const time = document.getElementById('ann-time').value.trim();
      if (!title || !date || !time) return;
      await addAnnouncement(title, date, time);
      if (document.getElementById('announcements-admin-list')) {
        const allAnns = await fetchAnnouncements(50);
        document.getElementById('announcements-admin-list').innerHTML = allAnns.map(a => `
          <div class="list-item"><h3>${a.title}</h3><p>${a.time} • ${a.date}</p></div>
        `).join('');
      }
      document.getElementById('ann-title').value = '';
      document.getElementById('ann-date').value = '';
      document.getElementById('ann-time').value = '';
    });
    const eventAddBtn = document.getElementById('event-add-btn');
    if (eventAddBtn) eventAddBtn.addEventListener('click', async () => {
      const title = document.getElementById('event-title').value.trim();
      const date = document.getElementById('event-date').value.trim();
      const fileEl = document.getElementById('event-image-file');
      const file = fileEl && fileEl.files && fileEl.files[0];
      if (!title || !date || !file) return;
      const url = await compressImageToDataURL(file);
      if (!url) return;
      await addEvent(title, date, url);
      if (document.getElementById('events-admin-list')) {
        const evsAll = await fetchEvents(50);
        document.getElementById('events-admin-list').innerHTML = evsAll.map(e => `
          <div class="list-item"><h3>${e.title}</h3><p>${e.date}</p></div>
        `).join('');
      }
      document.getElementById('event-title').value = '';
      document.getElementById('event-date').value = '';
      if (fileEl) fileEl.value = '';
    });
    const schAddBtn = document.getElementById('sch-add-btn');
    if (schAddBtn) schAddBtn.addEventListener('click', async () => {
      const title = document.getElementById('sch-title').value.trim();
      const start = document.getElementById('sch-start').value.trim();
      const end = document.getElementById('sch-end').value.trim();
      if (!title || !start || !end) return;
      await addSchedule(title, start, end);
      if (document.getElementById('schedule-admin-list')) {
        const schAll = await fetchSchedules(50);
        document.getElementById('schedule-admin-list').innerHTML = schAll.map(s => `
          <div class="list-item"><h3>${s.title}</h3><p>${s.time}</p></div>
        `).join('');
      }
      document.getElementById('sch-title').value = '';
      document.getElementById('sch-start').value = '';
      document.getElementById('sch-end').value = '';
    });
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
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.addEventListener('click', async () => {
      try {
        const newData = {
          ticker: document.getElementById('ticker-input').value,
          media: { type: document.getElementById('media-type').value, value: document.getElementById('media-value').value },
          officeInfo: {
            registrarHours: document.getElementById('registrar-hours').value,
            clinicStatus: document.getElementById('clinic-status').value,
            guidanceAvailability: document.getElementById('guidance-availability').value
          },
          facilityStatus: {
            library: document.getElementById('library-status').value,
            canteen: document.getElementById('canteen-status').value,
            laboratory: document.getElementById('laboratory-status').value
          }
        };
        const mfileEl = document.getElementById('media-image-file');
        const mfile = mfileEl && mfileEl.files && mfileEl.files[0];
        if (mfile) {
          newData.media.type = 'image';
          const url = await compressImageToDataURL(mfile);
          if (url) newData.media.value = url;
        }
        await saveConfigDocs(newData);
        alert('Settings Saved');
      } catch (e) {
        alert('Invalid data');
      }
    });
  }
});
