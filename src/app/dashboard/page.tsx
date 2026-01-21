"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { 
  Megaphone, 
  Calendar, 
  Flag, 
  Clock, 
  CloudSun, 
  QrCode, 
  Mic 
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  image: string;
  description: string;
}

interface Schedule {
  id: string;
  title: string;
  date: string;
  time: string;
}
interface MediaItem {
  id: string;
  type: "image" | "qr" | "quote";
  value: string;
  selected?: boolean;
}

export default function UserDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<{
    announcements: Announcement[];
    events: Event[];
    ticker: string;
    schedules?: Schedule[];
    media?: MediaItem | null;
  }>({ announcements: [], events: [], ticker: "", schedules: [], media: null });
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [overlayResults, setOverlayResults] = useState<string[]>([]);
  const recogRef = useRef<any>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubAnnouncements = onSnapshot(collection(db, "announcements"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const filtered = list.filter((x:any) => x.visible !== false);
      const prioritized = filtered.sort((a:any,b:any)=> (b.priority?1:0) - (a.priority?1:0));
      setData((prev) => ({ ...prev, announcements: prioritized.slice(0, 2) }));
    });

    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const filtered = list.filter((x:any) => x.visible !== false);
      setData((prev) => ({ ...prev, events: filtered.slice(0, 2) }));
    });

    const unsubSchedules = onSnapshot(collection(db, "schedules"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const today = new Date().toISOString().slice(0,10);
      const upcoming = list
        .filter((s:any) => s.visible !== false && s.date >= today)
        .sort((a:any,b:any)=> a.date.localeCompare(b.date) || (a.time||"").localeCompare(b.time||""));
      setData((prev) => ({ ...prev, schedules: upcoming.slice(0,3) }));
    });
    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const selected = list.find((m:any) => m.selected) || list[0] || null;
      setData((prev) => ({ ...prev, media: selected }));
    });

    const unsubTicker = onSnapshot(doc(db, "settings", "ticker"), (docSnap) => {
      const message = docSnap.exists() ? (docSnap.data() as any).message : "";
      setData((prev) => ({ ...prev, ticker: message }));
    });

    return () => {
      unsubAnnouncements();
      unsubEvents();
      unsubTicker();
      unsubSchedules();
      unsubMedia();
    };
  }, []);

  const startVoice = () => {
    setOverlayOpen(true);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.continuous = false;
      recog.lang = "en-US";
      recog.onresult = (e: any) => {
        const text = e.results[0][0].transcript as string;
        setVoiceText(text);
        handleQuery(text);
      };
      recog.start();
      recogRef.current = recog;
    }
  };

  const handleQuery = async (text: string) => {
    const t = text.toLowerCase();
    const out: string[] = [];
    if (t.includes("registrar")) out.push("Registrar: see office_info type=registrar");
    if (t.includes("clinic")) out.push("Clinic: see office_info type=clinic");
    if (t.includes("guidance")) out.push("Guidance: see office_info type=guidance");
    if (t.includes("library")) out.push("Library: see facilities type=library");
    if (t.includes("canteen")) out.push("Canteen: see facilities type=canteen");
    if (t.includes("laboratory")) out.push("Laboratory: see facilities type=laboratory");
    if (t.includes("rooms")) out.push("Rooms: see rooms collection");
    if (t.includes("announcements")) out.push("Full announcements available");
    if (t.includes("schedule")) out.push("Full schedule available");
    if (t.includes("events")) out.push("Upcoming events list available");
    setOverlayResults(out.length ? out : ["No direct match. Try: 'Hey Flexi, registrar office hours'."]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F0] overflow-hidden font-sans text-gray-800">
      
      {/* 1. Header: Time, Date, Weather */}
      <header className="flex flex-col items-center justify-center bg-[#F5F5F0]" style={{height: '10vh'}}>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-800 tracking-tight">
              {format(currentTime, "h:mm a")}
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              {format(currentTime, "EEEE, MMMM d")}
            </p>
          </div>
          <div className="flex flex-col items-end ml-8 text-gray-600">
            <CloudSun size={48} className="text-yellow-500" />
            <div className="text-lg font-medium">28°C</div>
            <div className="text-sm">31°C</div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="px-6 pb-2 overflow-hidden grid grid-cols-2 grid-rows-2 gap-6 w-full" style={{height: 'calc(100vh - 15vh)', gridTemplateRows: '70% 30%'}}>
        
        {/* Left Column */}
        <div className="grid gap-6 h-full" style={{gridTemplateRows: '70% 30%'}}>
          
          {/* 2. Announcements */}
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 lg:row-start-1 lg:col-start-1 h-full">
            <div className="bg-[#6B8EAD] px-4 py-3 flex items-center space-x-2">
              <Megaphone className="text-white" size={24} />
              <h2 className="text-white font-bold text-lg tracking-wide uppercase">Announcements</h2>
            </div>
            <div className="p-3 space-y-2">
              {Array.from({length:3}).map((_, i) => {
                const ann = data.announcements[i];
                return ann ? (
                  <div key={ann.id} className="bg-[#FFF8E7] rounded-xl p-3 flex items-start space-x-3 border-l-4 border-[#E6B800]">
                    {ann.type === 'flag' ? <Flag style={{width:'clamp(16px,2vw,22px)',height:'clamp(16px,2vw,22px)'}} className="text-[#E6B800] mt-1" /> : <Clock style={{width:'clamp(16px,2vw,22px)',height:'clamp(16px,2vw,22px)'}} className="text-[#6B8EAD] mt-1" />}
                    <div>
                      <h3 className="font-bold text-gray-800 text-[clamp(14px,1.5vw,18px)]">{ann.title}</h3>
                      <p className="text-gray-600 text-[clamp(12px,1.2vw,14px)]">{ann.time} • {ann.date}</p>
                    </div>
                  </div>
                ) : (
                  <div key={`ann-ph-${i}`} className="bg-[#FFF8E7] rounded-xl p-6 border-l-4 border-[#E6B800] flex items-center justify-center text-gray-400">Announcement Placeholder</div>
                );
              })}
            </div>
          </section>

          {/* 2.5 Daily Schedule & Reminders */}
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 h-full">
            <div className="bg-[#6B8EAD] px-4 py-3 flex items-center space-x-2">
              <Clock style={{width:'clamp(18px,2.4vw,26px)',height:'clamp(18px,2.4vw,26px)'}} className="text-white" />
              <h2 className="text-white font-bold text-lg tracking-wide uppercase">Today’s Schedule</h2>
            </div>
            <div className="p-3 space-y-2">
              {Array.from({length:3}).map((_, i) => {
                const sch = (data.schedules || [])[i];
                return sch ? (
                  <div key={sch.id} className="bg-[#FFF8E7] rounded-xl p-3 border-l-4 border-[#E6B800]">
                    <div className="flex items-center space-x-3">
                      <Clock style={{width:'clamp(16px,2vw,22px)',height:'clamp(16px,2vw,22px)'}} className="text-[#6B8EAD]" />
                      <div>
                        <div className="font-bold text-gray-800 text-[clamp(14px,1.5vw,18px)]">{sch.title}</div>
                        <div className="text-gray-600 text-[clamp(12px,1.2vw,14px)]">{sch.time} • {sch.date}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={`sch-ph-${i}`} className="bg-[#FFF8E7] rounded-xl p-6 border-l-4 border-[#E6B800] flex items-center justify-center text-gray-400">Schedule Placeholder</div>
                );
              })}
            </div>
          </section>

          {/* 3. Upcoming Events moved to right column */}

        </div>

        {/* Right Column */}
        <div className="grid gap-6 h-full" style={{gridTemplateRows: '50% 50%'}}>
          {/* Upper Right: Upcoming Events (Top 3) */}
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 h-full">
            <div className="bg-[#7CA99B] px-4 py-3 flex items-center space-x-2">
              <Calendar style={{width:'clamp(18px,2.4vw,26px)',height:'clamp(18px,2.4vw,26px)'}} className="text-white" />
              <h2 className="text-white font-bold text-lg tracking-wide uppercase">Upcoming Events</h2>
            </div>
            <div className="p-3 space-y-3">
              {(() => {
                const evt = data.events[0];
                return evt ? (
                  <div key={evt.id} className="bg-[#EBF5F8] rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800 text-[clamp(14px,1.5vw,18px)]">{evt.title}</h3>
                      <span className="text-[#6B8EAD] font-medium text-[clamp(12px,1.2vw,14px)]">{evt.date}</span>
                    </div>
                    <div className="h-[clamp(96px,12vh,140px)] bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400">
                      {evt.image ? (
                        <div className="w-full h-full bg-cover bg-center rounded-lg" style={{backgroundImage: `url('${evt.image}')`}}></div>
                      ) : (
                        <span>Image</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#EBF5F8] rounded-xl p-6 flex items-center justify-center text-gray-400">Event Placeholder</div>
                );
              })()}
            </div>
          </section>

           {/* 4. Media Highlights */}
           <div className="bg-[#F0F4F1] rounded-2xl p-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#7CA99B] h-full">
              <h3 className="font-bold text-gray-800 text-lg mb-2">Media Highlights</h3>
              {data.events.length === 0 && !data.ticker ? null : null}
              {data.media ? (
                data.media.type === "quote" ? (
                  <div className="bg-white rounded-xl shadow-sm p-6 text-gray-800 max-w-md">
                    {data.media.value}
                  </div>
                ) : data.media.type === "image" ? (
                  <div className="w-full h-40 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: `url('${(data as any).media.value}')`}} />
                  </div>
                ) : (
                  <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                    <QrCode size={120} className="text-gray-800" />
                  </div>
                )
              ) : (
                <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                  <QrCode size={120} className="text-gray-800" />
                </div>
              )}
              <button onClick={startVoice} className="bg-[#7CA99B] text-white px-6 py-2 rounded-full font-bold shadow-sm hover:bg-[#6B9688] transition">Voice Control</button>
           </div>
        </div>

      </main>

      {/* 5. Scrolling Ticker / Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#2D3748] text-white h-[5vh] flex items-center px-6 pt-1 z-50 shadow-lg">
        <div className="flex items-center space-x-2 mr-4 flex-shrink-0">
           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
           <span className="font-bold text-sm uppercase tracking-wider text-gray-300">Live</span>
        </div>
        
        {/* Marquee Effect */}
        <div className="overflow-hidden whitespace-nowrap flex-1 relative">
           <div className="inline-block animate-marquee pl-full">
              {data.ticker || "Welcome to Flexi Kiosk System. Please check announcements regularly."}
           </div>
        </div>

        {/* Voice Command Icon (Visual) */}
        <div className="ml-4 mt-1 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
           <Mic size={20} className="text-white" />
        </div>
      </footer>

      {overlayOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="font-bold mb-2">Voice Input</div>
            <div className="text-sm text-gray-600 mb-2">{voiceText || "Listening..."}</div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {overlayResults.map((r, i) => (<div key={i} className="p-2 border rounded text-sm">{r}</div>))}
            </div>
            <button onClick={()=>setOverlayOpen(false)} className="mt-4 px-4 py-2 bg-gray-900 text-white rounded">Close</button>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
