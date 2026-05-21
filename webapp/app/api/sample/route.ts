import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 120;

const SAMPLE_URL =
  "https://tammy-roundtable-demo.vercel.app/samples/exclusive-buyer-agreement-jordan-patel.pdf";

export async function POST() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const pdfRes = await fetch(SAMPLE_URL);
  if (!pdfRes.ok) {
    return NextResponse.json(
      { error: `Could not fetch sample PDF: ${pdfRes.status}` },
      { status: 500 }
    );
  }
  const bytes = new Uint8Array(await pdfRes.arrayBuffer());
  try {
    const result = await runPipeline(
      accessToken,
      bytes,
      "Exclusive Buyer Agreement - Jordan Patel (sample).pdf"
    );
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Sample pipeline failed", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Sample pipeline failed" },
      { status: 500 }
    );
  }
}

