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

async function loadOverview(accessToken: string) {
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

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const accessToken = (session as { accessToken?: string }).accessToken;
  const overview = accessToken ? await loadOverview(accessToken) : { error: "No access token" };

  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#1f1e1c]">
      <header className="border-b border-[#e5dfd0] bg-[#fffaf1]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-[#8a8175]">
              Maxwell Canyon Creek
            </p>
            <h1 className="font-serif text-xl text-[#16140f]">Realtor Workflow</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#5f574d]">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="text-sm px-3 py-1.5 rounded-full border border-[#d8cdb9] hover:bg-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <section>
          <DashboardClient />
          {"rootFolderUrl" in overview && overview.rootFolderUrl ? (
            <div className="mt-6 bg-white border border-[#e5dfd0] rounded-2xl p-5 text-sm">
              <h3 className="font-semibold mb-3 text-[#1f3a2b]">Your demo workspace</h3>
              <ul className="space-y-2">
                <li>
                  <a className="underline" href={overview.rootFolderUrl} target="_blank" rel="noreferrer">
                    Drive folder (root)
                  </a>
                </li>
                <li>
                  <a className="underline" href={overview.workbookUrl} target="_blank" rel="noreferrer">
                    Trade record workbook
                  </a>
                </li>
              </ul>
              <p className="text-xs text-[#5f574d] mt-3">
                These live in <em>your</em> Drive. We never see them.
              </p>
            </div>
          ) : null}
        </section>

        <section>
          <div className="bg-white border border-[#e5dfd0] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5dfd0] flex items-center justify-between">
              <h2 className="font-serif text-lg">Trade record</h2>
              <span className="text-xs text-[#5f574d]">
                Live from your{" "}
                {"workbookUrl" in overview && overview.workbookUrl ? (
                  <a className="underline" href={overview.workbookUrl} target="_blank" rel="noreferrer">
                    Sheet
                  </a>
                ) : (
                  "Sheet"
                )}
              </span>
            </div>
            {"error" in overview && overview.error ? (
              <div className="p-5 text-sm text-red-700">{overview.error}</div>
            ) : "rows" in overview && overview.rows && overview.rows.length === 0 ? (
              <div className="p-8 text-sm text-[#5f574d]">
                No transactions yet. Upload a signed agreement to seed the first row.
              </div>
            ) : "rows" in overview && overview.rows ? (
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#fbf8f0] sticky top-0">
                    <tr>
                      {overview.header.slice(0, 10).map((h: string) => (
                        <th
                          key={h}
                          className="text-left font-semibold px-3 py-2 border-b border-[#e5dfd0] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.rows
                      .slice()
                      .reverse()
                      .map((row: string[], i: number) => (
                        <tr key={i} className="border-b border-[#f1ebd9]">
                          {row.slice(0, 10).map((cell: string, j: number) => (
                            <td key={j} className="px-3 py-2 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

