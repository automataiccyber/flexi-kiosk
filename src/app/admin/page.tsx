"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Megaphone, Calendar, Type, Clock, Building, Box, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("announcement");
  const [loading, setLoading] = useState(false);

  // Announcement State
  const [announcement, setAnnouncement] = useState({
    title: "",
    date: "",
    time: "",
    type: "flag",
    priority: false,
    visible: true,
  });

  // Event State
  const [event, setEvent] = useState({
    title: "",
    date: "",
    description: "",
    image: "",
    visible: true,
  });

  // Ticker State
  const [ticker, setTicker] = useState("");
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [schedule, setSchedule] = useState({ title: "", date: "", time: "", visible: true });
  const [office, setOffice] = useState({ type: "registrar", value: "" });
  const [facility, setFacility] = useState({ type: "library", status: "open" });
  const [room, setRoom] = useState({ room: "101", status: "free" });
  const [media, setMedia] = useState({ type: "quote", value: "", selected: false });

  useEffect(() => {
    const unsubA = onSnapshot(collection(db, "announcements"), (snap) => {
      setAnnouncementsList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    const unsubE = onSnapshot(collection(db, "events"), (snap) => {
      setEventsList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => { unsubA(); unsubE(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let type = activeTab;
    let data: any = {};

    if (activeTab === "announcement") data = announcement;
    else if (activeTab === "event") data = event;
    else if (activeTab === "ticker") data = ticker;
    else if (activeTab === "schedule") data = schedule;
    else if (activeTab === "office") data = office;
    else if (activeTab === "facilities") data = facility;
    else if (activeTab === "rooms") data = room;
    else if (activeTab === "media") data = media;

    try {
      if (type === "announcement") await addDoc(collection(db, "announcements"), data);
      else if (type === "event") await addDoc(collection(db, "events"), data);
      else if (type === "ticker") await setDoc(doc(db, "settings", "ticker"), { message: data });
      else if (type === "schedule") await addDoc(collection(db, "schedules"), data);
      else if (type === "office") await addDoc(collection(db, "office_info"), data);
      else if (type === "facilities") await addDoc(collection(db, "facilities"), data);
      else if (type === "rooms") await addDoc(collection(db, "rooms"), data);
      else if (type === "media") await addDoc(collection(db, "media"), data);
      alert("Updated successfully!");
      // Reset forms
      setAnnouncement({ title: "", date: "", time: "", type: "flag", priority: false, visible: true });
      setEvent({ title: "", date: "", description: "", image: "", visible: true });
      setTicker("");
      setSchedule({ title: "", date: "", time: "", visible: true });
      setOffice({ type: "registrar", value: "" });
      setFacility({ type: "library", status: "open" });
      setRoom({ room: "101", status: "free" });
      setMedia({ type: "quote", value: "", selected: false });
  } catch (error) {
      console.error(error);
      alert("Failed to update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {/* Header */}
      <header className="bg-red-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Link href="/" className="text-sm underline hover:text-gray-200">Back to Kiosk</Link>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
        
        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-lg shadow-sm flex-wrap">
          <button
            onClick={() => setActiveTab("announcement")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition ${activeTab === "announcement" ? "bg-red-50 text-red-600 font-bold" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Megaphone size={20} />
            <span>Add Announcement</span>
          </button>
          <button
            onClick={() => setActiveTab("event")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition ${activeTab === "event" ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Calendar size={20} />
            <span>Add Event</span>
          </button>
           <button
            onClick={() => setActiveTab("ticker")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition ${activeTab === "ticker" ? "bg-green-50 text-green-600 font-bold" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Type size={20} />
            <span>Update Ticker</span>
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition ${activeTab === "schedule" ? "bg-yellow-50 text-yellow-600 font-bold" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Clock size={20} />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab("office")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition ${activeTab === "office" ? "bg-purple-50 text-purple-600 font-bold" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Building size={20} />
            <span>Office Info</span>
          </button>
          <button
            onClick={() => setActiveTab("facilities")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition ${activeTab === "facilities" ? "bg-teal-50 text-teal-600 font-bold" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Box size={20} />
            <span>Facilities</span>
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition ${activeTab === "rooms" ? "bg-indigo-50 text-indigo-600 font-bold" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <MapPin size={20} />
            <span>Rooms</span>
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition ${activeTab === "media" ? "bg-pink-50 text-pink-600 font-bold" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Type size={20} />
            <span>Media / QR / Quote</span>
          </button>
        </div>

        {/* Forms */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === "announcement" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">New Announcement</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={announcement.title}
                    onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="e.g. Flag Ceremony"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      required
                      value={announcement.date}
                      onChange={(e) => setAnnouncement({...announcement, date: e.target.value})}
                      className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      required
                      value={announcement.time}
                      onChange={(e) => setAnnouncement({...announcement, time: e.target.value})}
                      className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={announcement.type}
                    onChange={(e) => setAnnouncement({...announcement, type: e.target.value})}
                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="flag">Flag Ceremony</option>
                    <option value="meeting">Meeting</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={announcement.priority} onChange={(e)=>setAnnouncement({...announcement, priority: e.target.checked})} />
                    <span className="text-sm">Priority</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={announcement.visible} onChange={(e)=>setAnnouncement({...announcement, visible: e.target.checked})} />
                    <span className="text-sm">Visible</span>
                  </label>
                </div>
              </>
            )}

            {activeTab === "event" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">New Event</h2>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={event.title}
                    onChange={(e) => setEvent({...event, title: e.target.value})}
                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Science Fair"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date String</label>
                  <input
                    type="text"
                    required
                    value={event.date}
                    onChange={(e) => setEvent({...event, date: e.target.value})}
                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. March 5, 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={event.description}
                    onChange={(e) => setEvent({...event, description: e.target.value})}
                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32"
                    placeholder="Event details..."
                  />
                </div>
                <label className="flex items-center space-x-2 mt-2">
                  <input type="checkbox" checked={event.visible} onChange={(e)=>setEvent({...event, visible: e.target.checked})} />
                  <span className="text-sm">Visible</span>
                </label>
              </>
            )}

            {activeTab === "ticker" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Update Live Ticker</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ticker Message</label>
                  <textarea
                    required
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none h-32"
                    placeholder="Enter the scrolling message..."
                  />
                </div>
              </>
            )}
            {activeTab === "schedule" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Add Schedule / Reminder</h2>
                <input className="mt-1 w-full p-3 border rounded-lg" placeholder="Title" value={schedule.title} onChange={(e)=>setSchedule({...schedule, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="mt-1 w-full p-3 border rounded-lg" value={schedule.date} onChange={(e)=>setSchedule({...schedule, date: e.target.value})} />
                  <input type="time" className="mt-1 w-full p-3 border rounded-lg" value={schedule.time} onChange={(e)=>setSchedule({...schedule, time: e.target.value})} />
                </div>
                <label className="flex items-center space-x-2 mt-2">
                  <input type="checkbox" checked={schedule.visible} onChange={(e)=>setSchedule({...schedule, visible: e.target.checked})} />
                  <span className="text-sm">Visible</span>
                </label>
              </>
            )}
            {activeTab === "office" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Office Information</h2>
                <select className="mt-1 w-full p-3 border rounded-lg" value={office.type} onChange={(e)=>setOffice({...office, type: e.target.value})}>
                  <option value="registrar">Registrar</option>
                  <option value="clinic">Clinic</option>
                  <option value="guidance">Guidance</option>
                </select>
                <textarea className="mt-2 w-full p-3 border rounded-lg h-24" placeholder="Details" value={office.value} onChange={(e)=>setOffice({...office, value: e.target.value})} />
              </>
            )}
            {activeTab === "facilities" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Facility Status</h2>
                <select className="mt-1 w-full p-3 border rounded-lg" value={facility.type} onChange={(e)=>setFacility({...facility, type: e.target.value})}>
                  <option value="library">Library</option>
                  <option value="canteen">Canteen</option>
                  <option value="laboratory">Laboratory</option>
                </select>
                <select className="mt-2 w-full p-3 border rounded-lg" value={facility.status} onChange={(e)=>setFacility({...facility, status: e.target.value})}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </>
            )}
            {activeTab === "rooms" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Room Availability</h2>
                <input className="mt-1 w-full p-3 border rounded-lg" placeholder="Room" value={room.room} onChange={(e)=>setRoom({...room, room: e.target.value})} />
                <select className="mt-2 w-full p-3 border rounded-lg" value={room.status} onChange={(e)=>setRoom({...room, status: e.target.value})}>
                  <option value="free">Free</option>
                  <option value="occupied">Occupied</option>
                </select>
              </>
            )}
            {activeTab === "media" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Media / QR / Quote</h2>
                <select className="mt-1 w-full p-3 border rounded-lg" value={media.type} onChange={(e)=>setMedia({...media, type: e.target.value})}>
                  <option value="image">Image URL</option>
                  <option value="qr">QR URL</option>
                  <option value="quote">Quote</option>
                </select>
                <input className="mt-2 w-full p-3 border rounded-lg" placeholder="Value" value={media.value} onChange={(e)=>setMedia({...media, value: e.target.value})} />
                <label className="flex items-center space-x-2 mt-2">
                  <input type="checkbox" checked={media.selected} onChange={(e)=>setMedia({...media, selected: e.target.checked})} />
                  <span className="text-sm">Selected</span>
                </label>
              </>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition disabled:opacity-50">{loading ? "Saving..." : "Save Changes"}</button>
          </form>
          {announcementsList.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Existing Announcements</h3>
              <div className="space-y-2">
                {announcementsList.map((a)=> (
                  <div key={a.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm">{a.title}</div>
                    <div className="flex items-center space-x-2">
                      <button type="button" className="px-2 py-1 text-xs bg-gray-200 rounded" onClick={()=>updateDoc(doc(db, "announcements", a.id), { visible: !a.visible })}>{a.visible?"Hide":"Show"}</button>
                      <button type="button" className="px-2 py-1 text-xs bg-yellow-200 rounded" onClick={()=>updateDoc(doc(db, "announcements", a.id), { priority: !a.priority })}>{a.priority?"Unmark":"Mark Priority"}</button>
                      <button type="button" className="px-2 py-1 text-xs bg-red-500 text-white rounded" onClick={()=>deleteDoc(doc(db, "announcements", a.id))}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {eventsList.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Existing Events</h3>
              <div className="space-y-2">
                {eventsList.map((ev)=> (
                  <div key={ev.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm">{ev.title}</div>
                    <div className="flex items-center space-x-2">
                      <button type="button" className="px-2 py-1 text-xs bg-gray-200 rounded" onClick={()=>updateDoc(doc(db, "events", ev.id), { visible: !ev.visible })}>{ev.visible?"Hide":"Show"}</button>
                      <button type="button" className="px-2 py-1 text-xs bg-red-500 text-white rounded" onClick={()=>deleteDoc(doc(db, "events", ev.id))}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
