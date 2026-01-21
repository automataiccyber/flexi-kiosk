// --- Mock Data Initialization ---
const defaultData = {
  announcements: [
    { title: "Flag Ceremony", date: "Feb 20, 2026", time: "7:00 AM", type: "flag" },
    { title: "Student Council Meeting", date: "Feb 20, 2026", time: "10:00 AM", type: "meeting" },
    { title: "Library Closed", date: "Feb 21, 2026", time: "All Day", type: "general" },
    { title: "Extra Announcement", date: "Feb 22, 2026", time: "1:00 PM", type: "general" } 
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
    type: "qr", // or 'image'
    value: "Scan for Updates" // or image url
  },
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
function renderDashboard() {
  const data = getData();
  
  // Render Announcements
  const annContainer = document.getElementById('announcements-list');
  if (annContainer) {
    annContainer.innerHTML = data.announcements.slice(0, 3).map(a => `
      <div class="list-item">
        <h3>${a.title}</h3>
        <p>${a.time} • ${a.date}</p>
      </div>
    `).join('');
  }

  // Render Upcoming Events
  const eventsContainer = document.getElementById('events-list');
  if (eventsContainer) {
    eventsContainer.innerHTML = data.events.slice(0, 1).map(e => `
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
    scheduleContainer.innerHTML = data.schedules.slice(0, 2).map(s => `
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
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FlexiSystem" class="qr-code" alt="QR">
        <p style="margin-top:10px; font-weight:bold;">${data.media.value}</p>
        <button style="margin-top:10px; padding:5px 15px; background:var(--primary-green); color:white; border:none; border-radius:20px;">Scan for Updates</button>
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
function renderAdmin() {
  const data = getData();
  
  // Ticker Input
  const tickerInput = document.getElementById('ticker-input');
  if (tickerInput) tickerInput.value = data.ticker;

  const annInput = document.getElementById('announcements-input');
  if (annInput) annInput.value = JSON.stringify(data.announcements, null, 2);

  const eventsInput = document.getElementById('events-input');
  if (eventsInput) eventsInput.value = JSON.stringify(data.events, null, 2);
  
  const scheduleInput = document.getElementById('schedule-input');
  if (scheduleInput) scheduleInput.value = JSON.stringify(data.schedules, null, 2);

  const mediaInput = document.getElementById('media-input');
  if (mediaInput) mediaInput.value = JSON.stringify(data.media, null, 2);
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
    
    document.getElementById('save-btn').addEventListener('click', () => {
      try {
        const newData = {
          ticker: document.getElementById('ticker-input').value,
          announcements: JSON.parse(document.getElementById('announcements-input').value),
          events: JSON.parse(document.getElementById('events-input').value),
          schedules: JSON.parse(document.getElementById('schedule-input').value),
          media: JSON.parse(document.getElementById('media-input').value)
        };
        saveData(newData);
        alert('Settings Saved!');
      } catch (e) {
        alert('Invalid JSON format in one of the fields. Please check your syntax.');
      }
    });
  }
});