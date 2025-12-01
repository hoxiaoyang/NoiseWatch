import { NextResponse } from "next/server";

const LAMBDA_URL =
  process.env.TRAINING_LAMBDA_URL ??
  "https://2j2sn03s42.execute-api.ap-southeast-1.amazonaws.com/default/fine_tune_noise_classification";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Lambda responded with error:", response.status, details);
      return NextResponse.json(
        { error: `Lambda error: ${response.status}`, details },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log("Training job started:", data);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Error starting training job:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}