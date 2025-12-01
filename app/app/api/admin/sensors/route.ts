import { NextResponse } from "next/server";

export async function GET() {
  const sensors = ["sensor-1", "sensor-2", "sensor-3"];
  return NextResponse.json(sensors);
}