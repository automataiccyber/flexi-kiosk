import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, setDoc, getDoc } from "firebase/firestore";

// Helper to get data if Firebase is not configured (fallback)
// or just return empty/error if strictly Firebase
// For better UX, we'll try to use Firebase, catch errors, and maybe fallback or just fail gracefully.

export async function GET() {
  try {
    const announcementsSnapshot = await getDocs(collection(db, "announcements"));
    const announcements = announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const eventsSnapshot = await getDocs(collection(db, "events"));
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const tickerDoc = await getDoc(doc(db, "settings", "ticker"));
    const ticker = tickerDoc.exists() ? tickerDoc.data().message : "";

    return NextResponse.json({ announcements, events, ticker });
  } catch (error) {
    console.error("Firebase Read Error:", error);
    // Fallback to empty structure if Firebase fails (e.g. missing keys)
    return NextResponse.json({ announcements: [], events: [], ticker: "Error connecting to database." });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === "announcement") {
      await addDoc(collection(db, "announcements"), body.data);
    } else if (body.type === "event") {
      await addDoc(collection(db, "events"), body.data);
    } else if (body.type === "ticker") {
      await setDoc(doc(db, "settings", "ticker"), { message: body.data });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Firebase Write Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save data." }, { status: 500 });
  }
}
