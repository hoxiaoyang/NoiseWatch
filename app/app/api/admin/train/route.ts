import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const lambdaUrl = process.env.TRAINING_LAMBDA_URL;

    if (!lambdaUrl) {
      console.error("TRAINING_LAMBDA_URL not configured");
      return NextResponse.json(
        { error: "Lambda endpoint not configured" },
        { status: 500 }
      );
    }

    // Read raw CSV text from request body
    const csvText = await req.text();

    const response = await fetch(lambdaUrl, {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: csvText,
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