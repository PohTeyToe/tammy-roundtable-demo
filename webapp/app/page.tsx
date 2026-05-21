import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

const STEPS = [
  {
    label: "Read",
    body: "We parse the signed agreement and identify the buyer or seller side.",
  },
  {
    label: "File",
    body: "A transaction folder is created in your Drive. The signed PDF lands inside.",
  },
  {
    label: "Record",
    body: "A row is seeded in your trade record sheet with everything the agreement says.",
  },
  {
    label: "Remind",
    body: "Condition deadline and possession day go on your calendar as all-day reminders.",
  },
  {
    label: "Reply",
    body: "A follow-up email is drafted in your Gmail. Nothing sends.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-paper text-ink paper-grain">
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-20 md:pt-16 md:pb-28">
        {/* Wordmark */}
        <header className="flex items-center justify-between mb-16 md:mb-24">
          <div className="flex items-center gap-3">
            <Crest />
            <div className="leading-tight">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-3">
                Maxwell Canyon Creek
              </p>
              <p className="font-serif text-[15px] text-ink">Realtor Workflow</p>
            </div>
          </div>
          <p className="hidden md:block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
            Demo for the May 21 roundtable
          </p>
        </header>

        <div className="grid gap-16 md:gap-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24 items-start">
          {/* Editorial lede */}
          <section className="max-w-[34rem]">
            <p className="font-mono text-[11px] tracking-[0.20em] uppercase text-ink-3 mb-6">
              When a deal closes
            </p>
            <h1 className="font-serif text-[44px] md:text-[56px] leading-[1.02] tracking-[-0.015em] text-ink">
              Five things should happen on their own.
            </h1>
            <p className="mt-8 text-[17px] leading-[1.65] text-ink-2 max-w-[30rem]">
              Drop a signed buyer or seller agreement. The pipeline reads it, then files the deal, seeds the trade record, sets the reminders, and drafts the follow-up email. In your own Google account. Nothing leaves your inbox without you.
            </p>

            <ol className="mt-12 space-y-6">
              {STEPS.map((s, i) => (
                <li key={s.label} className="grid grid-cols-[3rem_1fr] gap-5 items-baseline">
                  <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-3 nums-tabular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-serif text-[20px] leading-tight text-ink">{s.label}</p>
                    <p className="mt-1 text-[14.5px] leading-[1.55] text-ink-2 max-w-[26rem]">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Sign-in card, anchored editorially */}
          <aside className="lg:sticky lg:top-12">
            <div className="rounded-[6px] bg-paper-2 border border-rule shadow-[var(--shadow-2)] overflow-hidden">
              <div className="px-7 pt-7 pb-6 border-b border-rule">
                <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-ink-3">
                  Begin
                </p>
                <h2 className="mt-2 font-serif text-[26px] leading-tight text-ink">
                  Sign in with the Google account that owns the deal.
                </h2>
                <p className="mt-3 text-[14px] leading-[1.6] text-ink-2">
                  The folder, the sheet, the calendar event, the draft. All of it lands in your Google. We never see it.
                </p>
              </div>

              <form
                className="px-7 pt-6 pb-7"
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <button
                  type="submit"
                  className="group w-full inline-flex items-center justify-center gap-3 bg-ink text-paper-2 px-5 py-3.5 rounded-[4px] font-medium text-[15px] transition-calm hover:bg-accent hover:text-accent-ink shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]"
                >
                  <GoogleMark />
                  <span>Continue with Google</span>
                  <ArrowRight />
                </button>

                <div className="mt-6 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[12.5px] text-ink-3 leading-relaxed">
                  <Dot /> <span>Drive, Sheets, Calendar, Gmail draft scopes</span>
                  <Dot /> <span>No auto-send. Drafts sit in your Gmail.</span>
                  <Dot /> <span>Demo data only. No real FINTRAC files.</span>
                </div>
              </form>

              <div className="px-7 py-5 bg-paper-3 border-t border-rule">
                <p className="text-[12px] leading-[1.55] text-ink-3">
                  <span className="font-medium text-ink-2">First time signing in?</span>{" "}
                  Google will show a &ldquo;hasn&rsquo;t verified this app&rdquo; warning because we&rsquo;re still in testing. That&rsquo;s normal for unreleased apps. Click <span className="font-mono text-[11px]">Advanced</span> then <span className="font-mono text-[11px]">Continue</span>.
                </p>
              </div>
            </div>

            <div className="stroke-divider my-10" />

            <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-ink-3 mb-3">
              Built around
            </p>
            <p className="text-[13.5px] leading-[1.6] text-ink-2 max-w-[24rem]">
              Tammy MacKenzie&rsquo;s revised flow. One transaction folder per deal, RMS &amp; Photos or Condo Docs as the only nested folder, the trade record checklist at the bottom of the sheet.
            </p>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-24 md:mt-32 pt-8 border-t border-rule flex flex-col md:flex-row gap-3 md:gap-8 items-start md:items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-3">
            Maxwell Canyon Creek &middot; Realtor demo &middot; 2026
          </p>
          <p className="text-[12px] text-ink-3">
            For the May 21 realtor roundtable. Not a production system.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Crest() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="text-accent"
    >
      <path
        d="M16 3 L27 9 L27 18 C27 23.5 22.5 28 16 29.5 C9.5 28 5 23.5 5 18 L5 9 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M11 17 L15 13 L17.5 15.5 L21 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.4C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.7 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.3 5.4C41.4 35 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="ml-auto opacity-70 group-hover:translate-x-0.5 group-hover:opacity-100 transition-calm"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dot() {
  return (
    <span
      className="mt-[7px] inline-block w-1 h-1 rounded-full bg-accent"
      aria-hidden="true"
    />
  );
}
