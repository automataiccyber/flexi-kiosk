"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Megaphone, Calendar, Type } from "lucide-react";

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
  });

  // Event State
  const [event, setEvent] = useState({
    title: "",
    date: "",
    description: "",
    image: "",
  });

  // Ticker State
  const [ticker, setTicker] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let type = activeTab;
    let data: any = {};

    if (activeTab === "announcement") {
      data = announcement;
    } else if (activeTab === "event") {
      data = event;
    } else if (activeTab === "ticker") {
      data = ticker;
    }

    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });
      alert("Updated successfully!");
      // Reset forms
      setAnnouncement({ title: "", date: "", time: "", type: "flag" });
      setEvent({ title: "", date: "", description: "", image: "" });
      setTicker("");
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
        <div className="flex space-x-4 mb-8 bg-white p-2 rounded-lg shadow-sm">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
