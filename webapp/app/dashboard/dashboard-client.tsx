"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PipelineResult = {
  transactionId: string;
  side: string;
  folderUrl?: string;
  subfolderUrl?: string;
  spreadsheetUrl?: string;
  pdfUrl?: string;
  draftUrl?: string;
  conditionEventId?: string;
  possessionEventId?: string;
  extracted?: {
    dealAddress?: string;
    buyerName?: string;
    sellerName?: string;
    soldPrice?: string;
    possessionDate?: string;
  };
};

type Props = {
  hasWorkspace: boolean;
  workbookUrl?: string;
};

export default function DashboardClient({ hasWorkspace, workbookUrl }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const run = useCallback(
    async (fn: () => Promise<Response>, displayName: string) => {
      setBusy(true);
      setFileName(displayName);
      setError("");
      setResult(null);
      try {
        const res = await fn();
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error || `HTTP ${res.status}`);
        } else {
          setResult(json.result);
          router.refresh();
        }
      } catch (err) {
        setError((err as Error).message || "Request failed");
      } finally {
        setBusy(false);
      }
    },
    [router]
  );

  const onFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && !file.type.includes("pdf")) {
      setError("That file is not a PDF. Drop the signed agreement as a PDF.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    run(() => fetch("/api/upload", { method: "POST", body: fd }), file.name);
  };

  const runSample = () => {
    run(
      () => fetch("/api/sample", { method: "POST" }),
      "Sample buyer agreement (Jordan Patel)"
    );
  };

  const reset = () => {
    setResult(null);
    setError("");
    setFileName(null);
  };

  // ---- States ----

  if (busy) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-[6px] bg-paper-2 border border-rule shadow-[var(--shadow-1)] overflow-hidden"
      >
        <div className="px-6 md:px-8 py-7 border-b border-rule">
          <div className="flex items-center gap-4">
            <Spinner />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-ink-3">
                In progress
              </p>
              <p className="mt-1 font-serif text-[22px] leading-tight text-ink">
                Filing the deal in your Google account.
              </p>
              {fileName ? (
                <p className="mt-1.5 text-[13px] text-ink-2 truncate">
                  <span className="font-mono text-[11.5px] text-ink-3">file</span>{" "}
                  {fileName}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="px-6 md:px-8 py-6 grid gap-3 text-[13px] leading-[1.6] text-ink-2">
          <p>
            We are reading the agreement, filing the PDF in your Drive, appending the trade record row, setting condition and possession reminders, and drafting the follow-up email.
          </p>
          <p className="text-ink-3 text-[12.5px]">
            About thirty to sixty seconds. The result panel appears below once the run finishes.
          </p>
        </div>
        <div className="px-6 md:px-8 py-4 bg-paper-3 border-t border-rule text-[12px] text-ink-3">
          Drive, Sheets, Calendar and Gmail. All in your own Google account.
        </div>
      </section>
    );
  }

  if (result) {
    return (
      <ResultPanel result={result} workbookUrl={workbookUrl} onReset={reset} />
    );
  }

  return (
    <section className="grid gap-6">
      {error ? <ErrorBanner message={error} onDismiss={() => setError("")} /> : null}

      <div className="rounded-[6px] bg-paper-2 border border-rule shadow-[var(--shadow-1)] overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-rule flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-ink-3">
              New transaction
            </p>
            <p className="mt-1.5 font-serif text-[22px] leading-tight text-ink">
              Drop a signed agreement
            </p>
          </div>
          <button
            type="button"
            onClick={runSample}
            className="inline-flex items-center gap-2 text-[12.5px] px-3.5 py-2 rounded-[4px] border border-rule hover:border-rule-strong hover:bg-paper-3 transition-calm text-ink-2"
          >
            <PlayIcon />
            Try the sample agreement
          </button>
        </div>

        <div className="p-6 md:p-8">
          <label
            htmlFor="pdf-input"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFile(e.dataTransfer.files?.[0] || null);
            }}
            className={`block rounded-[5px] border border-dashed px-6 py-12 md:py-16 text-center cursor-pointer transition-calm ${
              dragOver
                ? "border-accent bg-accent-soft"
                : "border-rule-strong bg-paper-3 hover:bg-paper hover:border-ink-4"
            }`}
          >
            <div className="mx-auto mb-4 w-11 h-11 rounded-full bg-paper-2 border border-rule flex items-center justify-center">
              <UploadIcon />
            </div>
            <p className="font-serif text-[18px] text-ink">
              Drop a PDF here, or click to choose.
            </p>
            <p className="mt-1.5 text-[13px] text-ink-2">
              Exclusive Buyer or Exclusive Seller agreement. Up to ten megabytes.
            </p>
            <p className="mt-4 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-3">
              Demo data only &middot; No real FINTRAC files
            </p>
            <input
              id="pdf-input"
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                onFile(e.target.files?.[0] || null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            />
          </label>

          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-[12.5px]">
            <Note title="Reads both sides">
              We detect buyer or seller from the agreement itself. No checkbox.
            </Note>
            <Note title="Filed once">
              Folder, sheet row, calendar event, draft. All in your Google.
            </Note>
            <Note title="Drafts only">
              The email is queued in your Gmail. You decide when to send.
            </Note>
          </div>
        </div>
      </div>

      {!hasWorkspace ? (
        <p className="text-[12px] text-ink-3 px-1">
          The first transaction will create the <span className="font-mono text-[11px]">MCC Realtor Workflow Demo</span> folder in your Drive.
        </p>
      ) : null}
    </section>
  );
}

function ResultPanel({
  result,
  workbookUrl,
  onReset,
}: {
  result: PipelineResult;
  workbookUrl?: string;
  onReset: () => void;
}) {
  const side = result.side?.toLowerCase() === "seller" ? "seller" : "buyer";
  const isBuyer = side === "buyer";
  return (
    <section className="rounded-[6px] bg-paper-2 border border-rule shadow-[var(--shadow-1)] overflow-hidden">
      <div className="px-6 md:px-8 py-6 border-b border-rule flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-success mb-2 inline-flex items-center gap-1.5">
            <Check /> Filed
          </p>
          <h2 className="font-serif text-[26px] leading-tight text-ink">
            {result.extracted?.dealAddress || result.transactionId}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
            <span className="font-mono text-[12px] text-ink">{result.transactionId}</span>
            <span className="text-ink-4">&middot;</span>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] font-mono text-[10.5px] tracking-[0.12em] uppercase border"
              style={{
                color: isBuyer ? "var(--buyer)" : "var(--seller)",
                borderColor: isBuyer ? "var(--buyer)" : "var(--seller)",
              }}
            >
              <span
                className="inline-block w-1 h-1 rounded-full"
                style={{ backgroundColor: isBuyer ? "var(--buyer)" : "var(--seller)" }}
              />
              {side} side
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-[12.5px] px-3.5 py-2 rounded-[4px] border border-rule hover:border-rule-strong hover:bg-paper-3 transition-calm text-ink-2"
        >
          <PlusIcon /> File another
        </button>
      </div>

      {result.extracted &&
        (result.extracted.buyerName ||
          result.extracted.sellerName ||
          result.extracted.soldPrice ||
          result.extracted.possessionDate) && (
          <dl className="px-6 md:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 text-[13.5px] border-b border-rule">
            {result.extracted.buyerName ? (
              <Detail label="Buyer">{result.extracted.buyerName}</Detail>
            ) : null}
            {result.extracted.sellerName ? (
              <Detail label="Seller">{result.extracted.sellerName}</Detail>
            ) : null}
            {result.extracted.soldPrice ? (
              <Detail label="Price" mono>
                {result.extracted.soldPrice}
              </Detail>
            ) : null}
            {result.extracted.possessionDate ? (
              <Detail label="Possession">{result.extracted.possessionDate}</Detail>
            ) : null}
          </dl>
        )}

      <ul className="px-6 md:px-8 py-2 divide-y divide-rule">
        <ResultLink
          href={result.subfolderUrl}
          title="Transaction folder in Drive"
          subtitle="Signed agreement filed inside"
          icon={<FolderIcon />}
        />
        <ResultLink
          href={result.pdfUrl}
          title="Signed agreement PDF"
          subtitle="Direct link to the uploaded file"
          icon={<DocumentIcon />}
        />
        <ResultLink
          href={result.spreadsheetUrl || workbookUrl}
          title="Trade record sheet"
          subtitle="New row appended"
          icon={<SheetIcon />}
        />
        <ResultLink
          href={result.draftUrl}
          title="Gmail draft"
          subtitle="Sitting in your drafts, never auto-sent"
          icon={<MailIcon />}
        />
      </ul>

      <div className="px-6 md:px-8 py-4 bg-paper-3 border-t border-rule text-[12px] text-ink-3">
        The condition and possession reminders are on your <span className="text-ink-2">MCC Realtor Workflow Demo</span> calendar.
      </div>
    </section>
  );
}

function ResultLink({
  href,
  title,
  subtitle,
  icon,
}: {
  href?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  if (!href) {
    return (
      <li className="flex items-center gap-4 py-3.5 opacity-50">
        <span className="text-ink-4">{icon}</span>
        <div className="flex-1">
          <p className="text-[14px] text-ink-2">{title}</p>
          <p className="text-[12px] text-ink-3">Not created this run</p>
        </div>
      </li>
    );
  }
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-4 py-3.5 hover:text-accent transition-calm"
      >
        <span className="text-ink-3 group-hover:text-accent transition-calm">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-ink truncate">{title}</p>
          <p className="text-[12px] text-ink-3 truncate group-hover:text-ink-2 transition-calm">
            {subtitle}
          </p>
        </div>
        <ArrowRight className="text-ink-4 group-hover:text-accent transition-calm group-hover:translate-x-0.5" />
      </a>
    </li>
  );
}

function Detail({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3 mb-1">
        {label}
      </dt>
      <dd className={`text-ink ${mono ? "font-mono text-[13px] nums-tabular" : ""}`}>
        {children}
      </dd>
    </div>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l border-rule pl-4">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3 mb-1">{title}</p>
      <p className="text-[12.5px] leading-[1.55] text-ink-2">{children}</p>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  // Detect Google's 403 "insufficient authentication scopes" so the user gets
  // the actual fix (re-grant Drive/Sheets/Calendar/Gmail on the consent screen)
  // instead of the generic "try again" message.
  const isScopeError =
    /insufficient.*scope|insufficientPermissions|PERMISSION_DENIED/i.test(message);

  return (
    <div
      role="alert"
      className="rounded-[5px] border bg-paper-2 p-4 md:p-5 flex items-start gap-4"
      style={{ borderColor: "var(--danger)" }}
    >
      <span
        className="mt-0.5 inline-flex w-5 h-5 rounded-full items-center justify-center text-[11px] font-mono shrink-0"
        style={{ backgroundColor: "var(--danger)", color: "var(--paper-2)" }}
        aria-hidden="true"
      >
        !
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: "var(--danger)" }}>
          {isScopeError ? "Google permissions missing" : "Something went wrong"}
        </p>
        {isScopeError ? (
          <>
            <p className="text-[14px] leading-[1.6] text-ink">
              Google didn&apos;t grant the app full access to your Drive, Sheets, Calendar, or Gmail. This usually means a checkbox was unchecked on Google&apos;s consent screen.
            </p>
            <p className="text-[13px] leading-[1.6] text-ink-2 mt-2">
              Fix in one minute:
            </p>
            <ol className="text-[13px] leading-[1.7] text-ink-2 mt-1 ml-4 list-decimal">
              <li>Open <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener" className="underline">myaccount.google.com/permissions</a></li>
              <li>Find &quot;MCC Realtor Workflow&quot; (or this app), click it, then &quot;Remove access&quot;</li>
              <li>Come back here, sign out, then sign in again</li>
              <li>On Google&apos;s consent screen, make sure <strong>every</strong> permission checkbox is ticked, then click Continue</li>
            </ol>
          </>
        ) : (
          <p className="text-[14px] leading-[1.6] text-ink">
            The pipeline did not finish. Your file did not leave your computer. Try again, or sign out and back in.
          </p>
        )}
        <details className="mt-3 group">
          <summary className="cursor-pointer text-[12px] text-ink-3 hover:text-ink-2 transition-calm select-none inline-flex items-center gap-1.5 list-none">
            <span className="inline-block w-2 h-2 border-r border-b border-ink-3 rotate-[-45deg] group-open:rotate-45 transition-transform" aria-hidden="true" />
            Technical detail
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-2 font-mono p-3 rounded-[4px] bg-paper-3 border border-rule overflow-x-auto">
            {message}
          </pre>
        </details>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[12px] text-ink-3 hover:text-ink transition-calm shrink-0"
        aria-label="Dismiss error"
      >
        Dismiss
      </button>
    </div>
  );
}

// ---- Icons ----

function Spinner() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-accent animate-spin"
      style={{ animationDuration: "1.4s" }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M21 12 A9 9 0 0 0 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5 L7 12 L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-accent">
      <path d="M12 16 V4 M7 9 L12 4 L17 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18 V20 A1 1 0 0 0 5 21 H19 A1 1 0 0 0 20 20 V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 3 L13 8 L4 13 Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3 V13 M3 8 H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2.5 5.5 A1 1 0 0 1 3.5 4.5 H7.5 L9.25 6.25 H16.5 A1 1 0 0 1 17.5 7.25 V15 A1 1 0 0 1 16.5 16 H3.5 A1 1 0 0 1 2.5 15 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
    </svg>
  );
}

function SheetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M3 8 H17 M3 12.5 H17 M7.5 3 V17 M12.5 3 V17" stroke="currentColor" strokeWidth="1.0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M2.5 5.5 L10 11 L17.5 5.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 2.5 H12 L16 6.5 V17 A0.5 0.5 0 0 1 15.5 17.5 H5 A0.5 0.5 0 0 1 4.5 17 V3 A0.5 0.5 0 0 1 5 2.5 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
      <path d="M12 2.5 V6.5 H16" stroke="currentColor" strokeWidth="1.3" fill="none" />
    </svg>
  );
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`transition-calm ${className}`}
    >
      <path d="M3 8 H13 M9 4 L13 8 L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
