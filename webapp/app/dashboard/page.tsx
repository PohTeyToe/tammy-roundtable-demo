import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import {
  DEMO_FOLDER_NAME,
  driveFolderUrl,
  findOrCreateFolder,
  findOrCreateWorkbook,
  readTradeRecord,
  spreadsheetUrl,
} from "@/lib/google";

export const dynamic = "force-dynamic";

type OverviewOk = {
  rootFolderUrl: string;
  workbookUrl: string;
  header: string[];
  rows: string[][];
};
type OverviewErr = { error: string };
type Overview = OverviewOk | OverviewErr;

async function loadOverview(accessToken: string): Promise<Overview> {
  try {
    const rootFolderId = await findOrCreateFolder(accessToken, DEMO_FOLDER_NAME);
    const workbookId = await findOrCreateWorkbook(accessToken, rootFolderId);
    const sheet = await readTradeRecord(accessToken, workbookId);
    const rows = sheet.values || [];
    const header = rows[0] || [];
    const dataRows = rows.slice(1);
    return {
      rootFolderUrl: driveFolderUrl(rootFolderId),
      workbookUrl: spreadsheetUrl(workbookId),
      header,
      rows: dataRows,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

const COLUMN_LABELS: Record<string, string> = {
  Timestamp: "Filed",
  "Transaction ID": "Transaction",
  Side: "Side",
  "Deal Address": "Address",
  "Buyer Name": "Buyer",
  "Seller Name": "Seller",
  "Sold Price": "Price",
  "Sale Date": "Sale date",
  "Possession Date": "Possession",
  "MLS Number": "MLS",
};

const VISIBLE_COLS = 8;

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const accessToken = (session as { accessToken?: string }).accessToken;
  const overview: Overview = accessToken
    ? await loadOverview(accessToken)
    : { error: "Missing Google access token. Sign out and back in." };

  const hasError = "error" in overview;
  const isEmpty = !hasError && overview.rows.length === 0;

  return (
    <main className="min-h-screen bg-paper text-ink paper-grain">
      {/* Top bar */}
      <header className="relative z-10 border-b border-rule bg-paper-2/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <a href="/dashboard" className="flex items-center gap-3 group">
            <Crest />
            <div className="leading-tight">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-3">
                Maxwell Canyon Creek
              </p>
              <p className="font-serif text-[15px] text-ink">Realtor Workflow</p>
            </div>
          </a>
          <div className="flex items-center gap-3 md:gap-5">
            {!hasError && "workbookUrl" in overview ? (
              <a
                href={overview.workbookUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 hover:text-accent transition-calm"
              >
                <SheetIcon />
                <span>Trade record</span>
              </a>
            ) : null}
            {!hasError && "rootFolderUrl" in overview ? (
              <a
                href={overview.rootFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 hover:text-accent transition-calm"
              >
                <FolderIcon />
                <span>Drive folder</span>
              </a>
            ) : null}
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[12.5px] text-ink-2">{session.user.name || "Signed in"}</span>
              <span className="text-[11px] text-ink-3">{session.user.email}</span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-[12.5px] px-3 py-1.5 rounded-[4px] border border-rule hover:border-rule-strong hover:bg-paper-2 transition-calm text-ink-2"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:py-14 grid gap-10">
        {/* Hero band: action + context */}
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div>
            <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-ink-3 mb-3">
              Workspace
            </p>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-[-0.015em] text-ink">
              {isEmpty
                ? "Drop your first signed agreement to start the pipeline."
                : "File a new transaction or review what you have."}
            </h1>
            <p className="mt-5 text-[15.5px] leading-[1.6] text-ink-2 max-w-[36rem]">
              The pipeline lands the deal in your Drive, seeds the row in your trade record, sets the reminders, and drafts the follow-up email. About thirty to sixty seconds end to end.
            </p>
          </div>

          {!hasError && "rootFolderUrl" in overview ? (
            <aside className="rounded-[6px] bg-paper-2 border border-rule p-5 md:p-6 shadow-[var(--shadow-1)]">
              <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-ink-3 mb-3">
                Your demo workspace
              </p>
              <ul className="grid gap-3 text-[13.5px]">
                <li>
                  <a
                    href={overview.rootFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-3 hover:text-accent transition-calm"
                  >
                    <FolderIcon className="mt-0.5 text-ink-3 group-hover:text-accent transition-calm" />
                    <span>
                      <span className="block text-ink">Drive folder</span>
                      <span className="block text-[12px] text-ink-3 group-hover:text-ink-2 transition-calm">
                        MCC Realtor Workflow Demo
                      </span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={overview.workbookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-3 hover:text-accent transition-calm"
                  >
                    <SheetIcon className="mt-0.5 text-ink-3 group-hover:text-accent transition-calm" />
                    <span>
                      <span className="block text-ink">Trade record sheet</span>
                      <span className="block text-[12px] text-ink-3 group-hover:text-ink-2 transition-calm">
                        Live, in your Drive
                      </span>
                    </span>
                  </a>
                </li>
              </ul>
              <p className="mt-5 pt-4 border-t border-rule text-[11.5px] leading-[1.55] text-ink-3">
                Everything stays in your Google. We never read it.
              </p>
            </aside>
          ) : null}
        </section>

        {/* Pipeline runner */}
        <DashboardClient
          hasWorkspace={!hasError && "rootFolderUrl" in overview}
          workbookUrl={!hasError && "workbookUrl" in overview ? overview.workbookUrl : undefined}
        />

        {/* Trade record */}
        <section>
          <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-ink-3 mb-2">
                Filed transactions
              </p>
              <h2 className="font-serif text-[24px] leading-tight text-ink">Trade record</h2>
            </div>
            {!hasError && !isEmpty ? (
              <p className="text-[12px] text-ink-3">
                <span className="nums-tabular">{overview.rows.length}</span>{" "}
                {overview.rows.length === 1 ? "row" : "rows"} from your{" "}
                <a
                  className="underline decoration-rule-strong underline-offset-2 hover:text-accent transition-calm"
                  href={overview.workbookUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sheet
                </a>
              </p>
            ) : null}
          </div>

          <div className="rounded-[6px] border border-rule bg-paper-2 overflow-hidden shadow-[var(--shadow-1)]">
            {hasError ? (
              <ErrorState message={overview.error} />
            ) : isEmpty ? (
              <EmptyState />
            ) : (
              <TradeTable header={overview.header} rows={overview.rows} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function TradeTable({ header, rows }: { header: string[]; rows: string[][] }) {
  const visible = header.slice(0, VISIBLE_COLS);
  const sideIdx = header.findIndex((h) => h.toLowerCase() === "side");
  const txIdx = header.findIndex((h) => h.toLowerCase().includes("transaction"));
  return (
    <div className="overflow-x-auto max-h-[60vh]">
      <table className="min-w-full text-[13px]">
        <thead className="bg-paper-3 sticky top-0 z-10">
          <tr>
            {visible.map((h) => (
              <th
                key={h}
                className="text-left font-medium px-4 py-3 border-b border-rule whitespace-nowrap font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-3"
              >
                {COLUMN_LABELS[h] || h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows
            .slice()
            .reverse()
            .map((row, i) => (
              <tr
                key={i}
                className="border-b border-rule last:border-b-0 hover:bg-paper-3/60 transition-calm"
              >
                {row.slice(0, VISIBLE_COLS).map((cell, j) => {
                  const isTx = j === txIdx;
                  const isSide = j === sideIdx;
                  return (
                    <td
                      key={j}
                      className={`px-4 py-3 whitespace-nowrap nums-tabular ${
                        isTx ? "font-mono text-[12px] text-ink" : "text-ink-2"
                      }`}
                    >
                      {isSide ? <SideTag value={cell} /> : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function SideTag({ value }: { value: string }) {
  const v = (value || "").toLowerCase();
  const isBuyer = v === "buyer";
  const isSeller = v === "seller";
  if (!isBuyer && !isSeller) return <span className="text-ink-3">{value}</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] font-mono text-[10.5px] tracking-[0.12em] uppercase border"
      style={{
        color: isBuyer ? "var(--buyer)" : "var(--seller)",
        borderColor: isBuyer ? "var(--buyer)" : "var(--seller)",
        backgroundColor: "transparent",
      }}
    >
      <span
        className="inline-block w-1 h-1 rounded-full"
        style={{ backgroundColor: isBuyer ? "var(--buyer)" : "var(--seller)" }}
      />
      {value}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 md:px-10 md:py-20 text-center">
      <div className="mx-auto mb-5 w-12 h-12 rounded-full border border-rule flex items-center justify-center bg-paper">
        <DocumentIcon />
      </div>
      <p className="font-serif text-[19px] text-ink mb-2">No transactions yet.</p>
      <p className="text-[14px] text-ink-2 max-w-[28rem] mx-auto leading-[1.6]">
        Drop a signed buyer or seller agreement above. Once the pipeline runs, the row lands here.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="px-6 py-10 md:px-8 md:py-12">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: "var(--danger)" }}>
        Could not load trade record
      </p>
      <p className="font-serif text-[18px] text-ink mb-3">Your Google session may have expired.</p>
      <pre className="text-[12px] leading-relaxed p-3 rounded-[4px] bg-paper-3 border border-rule whitespace-pre-wrap text-ink-2 overflow-x-auto">
        {message}
      </pre>
      <p className="mt-4 text-[13px] text-ink-2">
        Try signing out and back in. If the same error appears, the access token refresh has not landed.
      </p>
    </div>
  );
}

function Crest({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex w-7 h-7 items-center justify-center rounded-[3px] border border-accent text-accent font-serif text-[12.5px] leading-none tracking-[0.02em] pb-[1px] ${className}`}
    >
      MCC
    </span>
  );
}

function FolderIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2 4.5 A1 1 0 0 1 3 3.5 H6 L7.5 5 H13 A1 1 0 0 1 14 6 V12 A1 1 0 0 1 13 13 H3 A1 1 0 0 1 2 12 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

function SheetIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M2.5 6.5 H13.5 M2.5 10 H13.5 M6 2.5 V13.5 M10 2.5 V13.5" stroke="currentColor" strokeWidth="1.0" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-ink-3">
      <path
        d="M7 3 H14 L19 8 V20 A1 1 0 0 1 18 21 H7 A1 1 0 0 1 6 20 V4 A1 1 0 0 1 7 3 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <path d="M14 3 V8 H19" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M9 12 H16 M9 16 H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
