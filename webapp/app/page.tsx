import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f6f3ea] text-[#1f1e1c] p-6">
      <div className="max-w-xl w-full bg-white border border-[#e5dfd0] rounded-2xl p-10 shadow-[0_14px_38px_rgba(38,31,24,0.10)]">
        <p className="font-mono text-xs tracking-widest uppercase text-[#8a8175] mb-3">
          Maxwell Canyon Creek &middot; Realtor Workflow
        </p>
        <h1 className="font-serif text-4xl leading-tight tracking-tight text-[#16140f] mb-4">
          When a Realtor closes a deal, <span className="italic text-[#1f5d53]">five things</span> should happen on their own.
        </h1>
        <p className="text-[15px] text-[#3d3933] leading-relaxed mb-8">
          Upload the signed buyer or seller agreement. The pipeline reads it, creates the closing folder in your Drive,
          seeds a row in your trade record sheet, schedules condition and possession reminders on your calendar, and
          drafts the next-step email in your Gmail. Nothing sends.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-3 bg-[#1f3a2b] text-white px-6 py-3 rounded-full font-semibold shadow-md hover:bg-[#163f39] transition"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.4C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.7 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.3 5.4C41.4 35 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
            Sign in with Google to start
          </button>
        </form>
        <p className="mt-6 text-xs text-[#5f574d] leading-relaxed">
          Built for the May 21 realtor roundtable. The app asks for Drive, Sheets, Gmail draft, and Calendar access so it
          can do all five steps in your own Google account. First time you sign in you&apos;ll see a &ldquo;Google
          hasn&apos;t verified this app&rdquo; warning because we&apos;re still in testing &mdash; that&apos;s normal for
          unreleased apps. Click <strong>Advanced &rarr; Continue</strong>.
        </p>
      </div>
    </main>
  );
}

