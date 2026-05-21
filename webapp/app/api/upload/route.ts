import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json({ error: `Could not read form data: ${(err as Error).message}` }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
  }
  const arr = new Uint8Array(await file.arrayBuffer());
  try {
    const result = await runPipeline(accessToken, arr, file.name);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Pipeline failed", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Pipeline failed" },
      { status: 500 }
    );
  }
}

