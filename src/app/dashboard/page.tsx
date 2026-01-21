"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
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

export default function UserDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<{
    announcements: Announcement[];
    events: Event[];
    ticker: string;
  }>({ announcements: [], events: [], ticker: "" });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/data");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
    // Poll every 10 seconds for updates
    const poll = setInterval(fetchData, 10000);
    return () => clearInterval(poll);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F0] overflow-hidden font-sans text-gray-800">
      
      {/* 1. Header: Time, Date, Weather */}
      <header className="flex flex-col items-center justify-center py-6 bg-[#F5F5F0]">
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
      <main className="flex-1 px-6 pb-20 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto w-full">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* 2. Announcements */}
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="bg-[#6B8EAD] px-4 py-3 flex items-center space-x-2">
              <Megaphone className="text-white" size={24} />
              <h2 className="text-white font-bold text-lg tracking-wide uppercase">Announcements</h2>
            </div>
            <div className="p-4 space-y-3">
              {data.announcements.length === 0 ? (
                 <p className="text-gray-500 text-center py-4">No announcements today.</p>
              ) : (
                data.announcements.map((ann) => (
                  <div key={ann.id} className="bg-[#FFF8E7] rounded-xl p-4 flex items-start space-x-3 border-l-4 border-[#E6B800]">
                    {ann.type === 'flag' ? <Flag className="text-[#E6B800] mt-1" /> : <Clock className="text-[#6B8EAD] mt-1" />}
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{ann.title}</h3>
                      <p className="text-gray-600 text-sm">{ann.time} • {ann.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 3. Upcoming Events (List View) */}
           <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="bg-[#7CA99B] px-4 py-3 flex items-center space-x-2">
              <Calendar className="text-white" size={24} />
              <h2 className="text-white font-bold text-lg tracking-wide uppercase">Upcoming Events</h2>
            </div>
            <div className="p-4 space-y-4">
               {data.events.slice(0, 1).map((evt) => (
                  <div key={evt.id} className="bg-[#EBF5F8] rounded-xl p-4 flex flex-col">
                     <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-gray-800 text-xl">{evt.title}</h3>
                       <span className="text-[#6B8EAD] font-medium text-sm">{evt.date}</span>
                     </div>
                     <div className="h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400">
                        {/* Placeholder for actual image */}
                        {evt.image ? (
                           <div className="w-full h-full bg-cover bg-center rounded-lg" style={{backgroundImage: `url('https://placehold.co/600x400?text=${evt.title}')`}}></div>
                        ) : (
                           <span>Image</span>
                        )}
                     </div>
                  </div>
               ))}
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
           {/* More Events / Grid */}
           <div className="grid grid-cols-1 gap-4">
              {data.events.slice(1).map((evt) => (
                  <div key={evt.id} className="bg-white rounded-2xl shadow-sm p-4 flex space-x-4">
                     <div className="w-1/3 h-24 bg-gray-200 rounded-lg flex-shrink-0 bg-cover bg-center" style={{backgroundImage: `url('https://placehold.co/400x400?text=${evt.title}')`}}></div>
                     <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{evt.title}</h3>
                        <p className="text-sm text-blue-500 font-medium mb-1">{evt.date}</p>
                        <p className="text-sm text-gray-600 leading-snug">{evt.description}</p>
                     </div>
                  </div>
              ))}
           </div>

           {/* 4. QR Code / Scan for Updates */}
           <div className="bg-[#F0F4F1] rounded-2xl p-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#7CA99B]">
              <h3 className="font-bold text-gray-800 text-lg mb-2">Scan for Updates</h3>
              <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                 <QrCode size={120} className="text-gray-800" />
              </div>
              <button className="bg-[#7CA99B] text-white px-6 py-2 rounded-full font-bold shadow-sm hover:bg-[#6B9688] transition">
                 Scan for Updates
              </button>
           </div>
        </div>

      </main>

      {/* 5. Scrolling Ticker / Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#2D3748] text-white h-16 flex items-center px-4 z-50 shadow-lg">
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
        <div className="ml-4 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
           <Mic size={20} className="text-white" />
        </div>
      </footer>

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
