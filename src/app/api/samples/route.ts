import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "src", "data", "sample-transcripts.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const parsedData = JSON.parse(data);
    
    // Return only the basic info and transcripts to keep it light
    const samples = parsedData.transcripts.map((t: any) => ({
      id: t.id,
      fellowName: t.fellow.name,
      transcript: t.transcript
    }));

    return NextResponse.json(samples);
  } catch (error) {
    console.error("Error fetching samples:", error);
    return NextResponse.json({ error: "Failed to fetch samples" }, { status: 500 });
  }
}
