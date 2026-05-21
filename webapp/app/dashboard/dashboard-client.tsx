"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type PipelineResult = {
  transactionId: string;
  side: string;
  folderUrl?: string;
  subfolderUrl?: string;
  spreadsheetUrl?: string;
  pdfUrl?: string;
  draftUrl?: string;
};

export default function DashboardClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string>("");

  const run = useCallback(
    async (fn: () => Promise<Response>, busyMessage: string) => {
      setBusy(true);
      setStatus(busyMessage);
      setError("");
      setResult(null);
      try {
        const res = await fn();
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error || `HTTP ${res.status}`);
          setStatus("");
        } else {
          setStatus("Done.");
          setResult(json.result);
          router.refresh();
        }
      } catch (err) {
        setError((err as Error).message || "Request failed");
        setStatus("");
      } finally {
        setBusy(false);
      }
    },
    [router]
  );

  const onFile = (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    run(
      () => fetch("/api/upload", { method: "POST", body: fd }),
      `Processing ${file.name}. ~30 to 60 seconds...`
    );
  };

  return (
    <div className="bg-white border border-[#e5dfd0] rounded-2xl p-6">
      <h2 className="font-serif text-xl mb-2">New transaction</h2>
      <p className="text-sm text-[#5f574d] mb-4 leading-relaxed">
        Drop a signed buyer or seller agreement PDF. The system reads it and runs five steps in your own Google account.
      </p>

      <label
        className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          busy ? "opacity-60 pointer-events-none" : "border-[#c9c2ad] bg-[#fbf8f0] hover:bg-[#f3efe1]"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files?.[0] || null);
        }}
      >
        <div className="text-3xl font-semibold text-[#9a8f6c] mb-1">PDF</div>
        <div className="text-sm">Click or drop a signed agreement PDF</div>
        <div className="text-xs text-[#5f574d] mt-1">Demo data only. No real FINTRAC documents.</div>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
      </label>

      <button
        onClick={() =>
          run(
            () => fetch("/api/sample", { method: "POST" }),
            "Fetching the built-in sample buyer agreement and running the pipeline..."
          )
        }
        disabled={busy}
        className="mt-3 w-full text-sm px-4 py-2.5 rounded-full border border-[#c9c2ad] hover:bg-[#fbf8f0] disabled:opacity-50"
      >
        Or run with the built-in sample buyer agreement
      </button>

      {status ? <p className="mt-4 text-sm text-[#1f3a2b]">{status}</p> : null}
      {error ? (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <strong>Error:</strong>
          <pre className="whitespace-pre-wrap text-xs mt-1">{error}</pre>
        </div>
      ) : null}
      {result ? (
        <div className="mt-4 p-4 rounded-lg bg-[#f3efe1] text-sm">
          <p className="font-semibold mb-2">
            {result.transactionId} &mdash; {result.side} side
          </p>
          <ul className="space-y-1">
            {result.subfolderUrl ? (
              <li>
                <a className="underline" href={result.subfolderUrl} target="_blank" rel="noreferrer">
                  Open the closing folder
                </a>
              </li>
            ) : null}
            {result.pdfUrl ? (
              <li>
                <a className="underline" href={result.pdfUrl} target="_blank" rel="noreferrer">
                  Open the signed agreement
                </a>
              </li>
            ) : null}
            {result.spreadsheetUrl ? (
              <li>
                <a className="underline" href={result.spreadsheetUrl} target="_blank" rel="noreferrer">
                  Open the trade record sheet
                </a>
              </li>
            ) : null}
            {result.draftUrl ? (
              <li>
                <a className="underline" href={result.draftUrl} target="_blank" rel="noreferrer">
                  Open the Gmail draft
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

