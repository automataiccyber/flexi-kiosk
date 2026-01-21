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

function getStorage() {
  try {
    const db = getFirestoreDB();
    if (!db) return null;
    return firebase.storage();
  } catch {
    return null;
  }
}

async function uploadImage(file, folder) {
  const storage = getStorage();
  if (!storage || !file) return null;
  const key = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
  const ref = storage.ref().child(key);
  const snap = await ref.put(file);
  return await snap.ref.getDownloadURL();
}

async function fetchAnnouncements(limitCount = 3) {
  const db = getFirestoreDB();
  if (!db) return getData().announcements.slice(0, limitCount);
  const snap = await db.collection('announcements').orderBy('createdAt', 'desc').limit(limitCount).get();
  return snap.docs.map(d => d.data());
}

async function addAnnouncement(title, date, time) {
  const db = getFirestoreDB();
  if (!db) {
    const data = getData();
    data.announcements.unshift({ title, date, time });
    saveData(data);
    return;
  }
  await db.collection('announcements').add({ title, date, time, createdAt: new Date().toISOString() });
}

async function fetchEvents(limitCount = 1) {
  const db = getFirestoreDB();
  if (!db) return getData().events.slice(0, limitCount);
  const snap = await db.collection('events').orderBy('createdAt', 'desc').limit(limitCount).get();
  return snap.docs.map(d => d.data());
}

async function addEvent(title, date, image) {
  const db = getFirestoreDB();
  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  if (!db) {
    const data = getData();
    data.events.unshift({ title, date: displayDate, image });
    saveData(data);
    return;
  }
  await db.collection('events').add({ title, date: displayDate, image, createdAt: new Date().toISOString() });
}

async function fetchSchedules(limitCount = 2) {
  const db = getFirestoreDB();
  if (!db) return getData().schedules.slice(0, limitCount);
  const snap = await db.collection('schedules').orderBy('createdAt', 'desc').limit(limitCount).get();
  return snap.docs.map(d => d.data());
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
  if (!db) {
    saveData(payload);
    return;
  }
  await db.collection('config').doc('ticker').set({ text: payload.ticker });
  await db.collection('config').doc('media').set(payload.media);
  await db.collection('config').doc('officeInfo').set(payload.officeInfo);
  await db.collection('config').doc('facilityStatus').set(payload.facilityStatus);
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
  const db = getFirestoreDB();
  if (!db) return getData().roomAvailability;
  const snap = await db.collection('rooms').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => d.data());
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
    if (data.media.type === 'qr') {
      mediaContainer.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.media.value || 'FlexiSystem')}" class="qr-code" alt="QR">
        <p style="margin-top:10px; font-weight:bold;">${data.media.value}</p>
      `;
    } else if (data.media.type === 'quote') {
      mediaContainer.innerHTML = `
        <div style="font-size:1.2rem; font-weight:bold;">“${data.media.value}”</div>
      `;
    } else {
      mediaContainer.innerHTML = `
        <div style="width:100%; height:100%; background-image:url('${data.media.value}'); background-size:cover; background-position:center; border-radius:8px;"></div>
      `;
    }
  }

  // Render Ticker
  const tickerEl = document.getElementById('ticker-text');
  if (tickerEl) {
    tickerEl.textContent = data.ticker;
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
      const url = await uploadImage(file, 'events');
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
        if (newData.media.type === 'image') {
          const mfileEl = document.getElementById('media-image-file');
          const mfile = mfileEl && mfileEl.files && mfileEl.files[0];
          if (mfile) {
            const url = await uploadImage(mfile, 'media');
            if (url) newData.media.value = url;
          }
        }
        await saveConfigDocs(newData);
        alert('Settings Saved');
      } catch (e) {
        alert('Invalid data');
      }
    });
  }
});
