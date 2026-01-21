import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define the path to the JSON file
// In a real app, use a proper database.
// For Vercel (Serverless), writing to the filesystem does NOT persist.
// But for this demo (npm run dev), it works fine locally.
const dbPath = path.join(process.cwd(), "src/lib/db.json");

function readDb() {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { announcements: [], events: [], ticker: "" };
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to write to db", error);
  }
}

export async function GET() {
  const data = readDb();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = readDb();

  if (body.type === "announcement") {
    const newAnnouncement = {
      id: Date.now().toString(),
      ...body.data,
    };
    db.announcements.push(newAnnouncement);
  } else if (body.type === "event") {
     const newEvent = {
      id: Date.now().toString(),
      ...body.data,
    };
    db.events.push(newEvent);
  } else if (body.type === "ticker") {
    db.ticker = body.data;
  }

  writeDb(db);
  return NextResponse.json({ success: true, data: db });
}
