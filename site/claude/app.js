(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // CHAPTERS — the spine of the mini-app
  // ============================================================
  const chapters = [
    { key: "welcome",   num: "01", title: "Welcome",            short: "Welcome",          duration: "1 min" },
    { key: "basics",    num: "02", title: "The basics",         short: "The basics",       duration: "3 min" },
    { key: "surfaces",  num: "03", title: "Where Claude lives", short: "Surfaces map",     duration: "3 min" },
    { key: "scenarios", num: "04", title: "In Tammy's world",   short: "Tammy's world",    duration: "3 min" },
    { key: "fit",       num: "05", title: "Fit & limits",       short: "Fit & limits",     duration: "1 min" },
    { key: "questions", num: "06", title: "Common questions",   short: "Q & A",            duration: "1 min" },
    { key: "start",     num: "07", title: "Your first move",    short: "Start small",      duration: "2 min" }
  ];

  // ============================================================
  // DATA — content for each interactive widget
  // ============================================================

  const briefData = {
    thin: {
      prompt: "Write a follow-up to my client.",
      reply: [
        { tag: "p", text: "Hi [Client],"},
        { tag: "p", text: "Thanks for the meeting today. Let me know if you have any questions or if there is anything else I can help with."},
        { tag: "p", text: "Best,\nTammy"}
      ],
      note: "Generic in, generic out. Claude has nothing concrete to anchor the answer to, so it falls back to a template that could be from anyone, to anyone, about anything."
    },
    thick: {
      prompt: [
        { label: "Role",     line: "You're helping me draft a real estate client follow-up." },
        { label: "Audience", line: "The client is nervous about timing and wants reassurance." },
        { label: "Tone",     line: "Warm and human. Not corporate. Not over-formal." },
        { label: "Shape",    line: "Under 120 words. End with the one decision I need from them." },
        { label: "Source",   line: "[my meeting notes pasted in below]" }
      ],
      reply: [
        { tag: "p", text: "<strong>Hi Sarah,</strong>"},
        { tag: "p", text: "Thanks for taking the time on Tuesday — I know we covered a lot, and I want to make sure nothing falls through the cracks." },
        { tag: "p", text: "Quick recap of what's lined up next: the inspection is booked for Friday at 10am, the updated trade record is heading your way by Thursday end-of-day, and I'm holding off on the lender introduction until I hear back from you." },
        { tag: "p", text: "<strong>The one thing I need from you</strong> is a thumbs-up on the lender choice — Option A in the document I shared. Once I have that, we can keep everything moving on schedule with no extra steps from you." },
        { tag: "p", text: "Talk soon,\nTammy" }
      ],
      note: "Specific role, specific tone, specific scope, real source material. The output is reviewable, not generic. The lift is in the brief, not in Claude."
    }
  };

  const atlasData = {
    chat: {
      tag: "Everyday use",
      title: "Chat — the fastest way in.",
      lede: "Quick back-and-forth. The closest experience to texting a careful coworker. It is where almost every Claude story starts.",
      good: [
        "Turning rough notes into a usable email or update",
        "Summarizing a long thread or document on the spot",
        "Asking follow-up questions until the answer fits"
      ],
      bridge: "For Tammy's world, this is the everyday lane: clean up a draft, rewrite a client note, summarize a file, turn scattered notes into next steps."
    },
    cowork: {
      tag: "Everyday use",
      title: "Cowork — for jobs that need more than one reply.",
      lede: "A desktop mode where Claude stays with a longer multi-step task, working through files, references, and tools instead of expecting one short answer.",
      good: [
        "Building a briefing from multiple documents",
        "Preparing a fuller package across files and notes",
        "Repeating the same multi-step workflow with less retyping"
      ],
      bridge: "This is the right fit when someone wants a real first pass on a recurring workflow, not just a one-message answer."
    },
    code: {
      tag: "Everyday use",
      title: "Code — mostly for the people building the tools.",
      lede: "Same Claude, shaped around repositories, debugging, and software changes. For Tammy, the practical point is that technical teams can use Claude to improve the software around her workflow.",
      good: [
        "Understanding a codebase",
        "Debugging and editing software",
        "Turning product ideas into real changes"
      ],
      bridge: "You may never use this mode directly. It matters because it is one of the ways technical teams improve the tools and processes around your work."
    },
    "in-tool": {
      tag: "Everyday use",
      title: "In-tool — Claude inside the tools you already use.",
      lede: "Beyond chat and the desktop app, Claude can show up inside Slack, Excel, PowerPoint, Chrome, and other surfaces — meeting work where it lives.",
      good: [
        "Summarizing a Slack thread without leaving Slack",
        "Helping with formulas or slides in their native app",
        "Browser-side research without copy-pasting into another tab"
      ],
      bridge: "The real question isn't only whether to use Claude. It is where Claude should fit so people stop bouncing between tabs."
    },
    projects: {
      tag: "Repeat work",
      title: "Projects — a home for work that keeps coming back.",
      lede: "A stable workspace with its own chats, files, and instructions. The point is to stop re-explaining the same background every time a recurring workflow returns.",
      good: [
        "A client account hub",
        "An office process with recurring document rules",
        "A research lane with reusable source material"
      ],
      bridge: "If a brokerage, transaction type, or office process keeps repeating, that is the signal it belongs in a project."
    },
    artifacts: {
      tag: "Repeat work",
      title: "Artifacts — outputs you can actually share.",
      lede: "Substantial outputs live in their own pane: checklists, mini-sites, dashboards, explainers, SOPs. The deliverable, not the conversation about the deliverable.",
      good: [
        "Reusable checklists or SOPs",
        "Mini-sites and explainers",
        "Dashboards, calculators, structured documents"
      ],
      bridge: "This walkthrough is itself an example: not just talk about Claude, but a thing Tammy can actually review and pass on."
    },
    skills: {
      tag: "Repeat work",
      title: "Skills — repeatable playbooks for Claude.",
      lede: "A skill is a packaged method Claude follows again and again. It turns 'we keep correcting Claude the same way' into a reusable procedure.",
      good: [
        "Spreadsheet or presentation generation",
        "Brand or review workflows",
        "Meeting structures, checklists, internal procedures"
      ],
      bridge: "If the same instruction keeps being repeated, that's the signal it should become a skill instead of another one-off prompt."
    },
    connectors: {
      tag: "Connected work",
      title: "Connectors — reach into the tools you already use.",
      lede: "Reduces copy-paste by letting Claude work from real source material in cloud apps and local tools — with permission boundaries you control.",
      good: [
        "Finding the right file in Drive",
        "Summarizing a Slack thread or email chain",
        "Pulling status from a task or business system"
      ],
      bridge: "Relevant whenever the answer sits across inboxes, shared docs, and operating tools instead of in one tidy file."
    },
    search: {
      tag: "Connected work",
      title: "Search — ask the whole organization.",
      lede: "Instead of searching one app at a time, Claude searches across company knowledge and returns synthesized answers with citations.",
      good: [
        "What happened while I was away?",
        "What's our policy for this process?",
        "What's blocking this project right now?"
      ],
      bridge: "Useful in office or brokerage settings when the real answer is scattered across email, shared docs, and team conversations."
    },
    research: {
      tag: "Connected work",
      title: "Research — multi-source briefings with citations.",
      lede: "Claude plans the investigation, checks multiple angles, gathers sources, and returns a more complete briefing — not a one-shot summary.",
      good: [
        "Vendor or option comparisons",
        "Market or competitor research",
        "Policy, process, or launch briefings"
      ],
      bridge: "The right mode when a fast one-paragraph answer would be too shallow to trust."
    }
  };

  const caseData = {
    realtor: {
      meta: {
        title: "Realtor intake — a signed agreement arrives.",
        lede: "The point is not to replace the realtor. The point is to flatten the admin layer around the relationship so the realtor's time goes to the relationship work, not the retyping.",
        meta: [
          { label: "Trigger",   value: "Signed agreement of purchase and sale" },
          { label: "Claude uses", value: "Chat · Artifacts · Connected tools" },
          { label: "Review by", value: "The realtor" },
          { label: "Why it matters", value: "Turns admin setup into a prepared draft instead of a blank start" }
        ]
      },
      stages: [
        {
          tag: "Stage 01 · Trigger",
          title: "Signed PDF lands in the inbox.",
          text: "An accepted offer comes back signed. Normally this kicks off 40 minutes of file setup, retyping into the trade record, drafting reminders, and chasing missing attachments before the realtor can even read it cleanly.",
          evidenceLabel: "The starting state",
          evidence: { kind: "doc", html: "<strong>Inbox · 11:47am</strong><br><span style=\"font-family:var(--mono);font-size:12px;color:var(--ink-mute)\">FW: Signed APS — 14 Maple Crescent</span><br><br>Attachments: <strong>aps-signed.pdf</strong>, mortgage-letter.pdf, deposit-confirm.pdf<br><br><em>Nothing organized. Nothing scheduled. Nothing prepared.</em>" }
        },
        {
          tag: "Stage 02 · Claude prepares",
          title: "Folder built. Trade record drafted. Reminders staged.",
          text: "Claude reads the agreement, extracts the working details, drafts the trade record, sets up the folder, and stages the inspection and closing-date reminders. None of it is sent or filed until a person signs off.",
          evidenceLabel: "Prepared workflow folder",
          evidence: { kind: "image", src: "./images/workflow-file.png", alt: "Workflow folder pre-populated from the agreement details." }
        },
        {
          tag: "Stage 03 · Claude prepares",
          title: "Client follow-up draft, in the realtor's voice.",
          text: "A warm, client-safe follow-up email is queued — referencing the actual file, the actual dates, and the one decision the client needs to confirm. Tone matches prior outbound from this realtor.",
          evidenceLabel: "Drafted reply",
          evidence: { kind: "image", src: "./images/workflow-reply.png", alt: "Drafted client follow-up reply staged for review." }
        },
        {
          tag: "Stage 04 · Human review",
          title: "The realtor reviews everything before anything moves.",
          text: "Folder, trade record, reminders, and draft email all sit in a 'pending review' state. The realtor checks names, dates, dollar figures, and the tone of the message. Nothing is sent automatically.",
          evidenceLabel: "What gets checked",
          evidence: { kind: "doc", html: "<strong>Review checklist</strong><ul><li>Client and property details match the signed agreement</li><li>Closing and inspection dates land on the right calendar days</li><li>Dollar figures in the trade record match the offer</li><li>Email tone fits the relationship and doesn't over-promise</li></ul>" },
          isReview: true
        },
        {
          tag: "Stage 05 · The send",
          title: "One click. File is open. Client is informed.",
          text: "After a 4-minute review, the realtor approves the package. The folder lives in the right place, the reminders are scheduled, and the client gets a warm, accurate follow-up that took a fraction of the usual time to produce.",
          evidenceLabel: "What the client sees",
          evidence: { kind: "doc", html: "<strong>To:</strong> Sarah Mitchell<br><strong>From:</strong> Tammy<br><strong>Subject:</strong> 14 Maple Crescent — what happens next<br><br>Hi Sarah, thanks for getting that signed. Quick recap of the timeline and the one thing I'll need from you by Wednesday. The inspection is booked for Friday at 10am — I'll meet you there." },
          isFinal: true
        }
      ],
      coda: {
        why:    "The pain isn't writing the email. The pain is reassembling the same admin scaffolding around every file. Claude prepares the scaffolding so the realtor can spend time on the parts that need judgment.",
        review: "A real human still checks names, dates, dollar figures, and the final communication. The setup makes the review fast — it doesn't replace it."
      }
    },

    brokerage: {
      meta: {
        title: "Brokerage follow-up — turning chaos into a clean handoff.",
        lede: "A long email thread, several documents, scattered action items. Claude turns that into one readable summary, one checklist, one draft response — for a person to review before anything is shared.",
        meta: [
          { label: "Trigger",   value: "Mid-week pile-up of threads & docs" },
          { label: "Claude uses", value: "Cowork · Projects · Connectors" },
          { label: "Review by", value: "Brokerage lead" },
          { label: "Why it matters", value: "Turns scattered follow-up into one reviewable package" }
        ]
      },
      stages: [
        {
          tag: "Stage 01 · Trigger",
          title: "Three threads, two files, one ticking clock.",
          text: "By Wednesday, the brokerage lead has a long client thread, three documents, and a list of half-tracked action items. The handoff is due Thursday morning. Most of the day is normally spent reassembling.",
          evidenceLabel: "The starting state",
          evidence: { kind: "doc", html: "<strong>Open items</strong><br><span style=\"font-family:var(--mono);font-size:12px;color:var(--ink-mute)\">3 email threads · 2 contracts · 1 financing doc · undefined ownership on 2 items</span><br><br><em>Everything is in there somewhere. None of it is decision-ready.</em>" }
        },
        {
          tag: "Stage 02 · Claude prepares",
          title: "The thread is summarized. Decisions are surfaced. Gaps are named.",
          text: "Claude reads through the full thread and attached docs, surfaces what was actually decided, identifies what's still missing, and proposes the next step with reasoning the lead can react to.",
          evidenceLabel: "Cowork working surface",
          evidence: { kind: "image", src: "./images/cowork-chrome-dashboard-flow.png", alt: "Cowork working surface showing multi-source summary." }
        },
        {
          tag: "Stage 03 · Claude prepares",
          title: "Draft internal update + reminder log + outgoing reply.",
          text: "Three deliverables sit ready: a short internal update for the team, a reminder log with clear ownership, and a draft of the outbound message to the client — all in the brokerage's tone.",
          evidenceLabel: "Prepared deliverables",
          evidence: { kind: "image", src: "./images/workflow-remind.png", alt: "Reminders log and ownership prepared." }
        },
        {
          tag: "Stage 04 · Human review",
          title: "The lead reviews and adjusts.",
          text: "The brokerage lead reads the summary, confirms the facts, and tightens the tone where it doesn't quite land. The review is fast because Claude has already flagged the items it was unsure about.",
          evidenceLabel: "What gets checked",
          evidence: { kind: "doc", html: "<strong>Review surface</strong><ul><li>Decisions match what was actually agreed in the thread</li><li>Ownership of each open item is correct</li><li>The outbound message reads in our voice, not Claude's</li><li>Sensitive details aren't surfaced in the wrong direction</li></ul>" },
          isReview: true
        },
        {
          tag: "Stage 05 · The send",
          title: "Update goes out. Team is aligned. Thursday morning is calm.",
          text: "After a 6-minute review, the lead approves the package. The team has a clean update, the client has a thoughtful reply, and the open items have named owners with dates.",
          evidenceLabel: "The downstream effect",
          evidence: { kind: "doc", html: "<strong>Result</strong><br>· Team aligned in one short read<br>· Client reply sent in the right voice<br>· Open items now have owners + dates<br><br><em>Thursday morning starts at 'what's next' instead of 'what happened.'</em>" },
          isFinal: true
        }
      ],
      coda: {
        why:    "When the work spans threads, documents, and people, the lift isn't writing — it's reassembly. Claude reassembles. The lead decides what's shared.",
        review: "The brokerage lead still confirms the facts, the tone, and what should and shouldn't be surfaced. Claude flags its uncertainty so the review is targeted."
      }
    },

    office: {
      meta: {
        title: "Office coordination - what is still missing before tomorrow?",
        lede: "Sometimes the real office question is not writing a reply. It is figuring out what is still open across inboxes, shared docs, and reminder lists before a meeting or deadline lands.",
        meta: [
          { label: "Trigger",   value: "End-of-day check before tomorrow's office meeting" },
          { label: "Claude uses", value: "Search | Connectors | Artifacts" },
          { label: "Review by", value: "Office lead" },
          { label: "Why it matters", value: "Turns scattered status into one reviewable briefing" }
        ]
      },
      stages: [
        {
          tag: "Stage 01 - Trigger",
          title: "\"What is still missing before tomorrow morning?\"",
          text: "By late afternoon, the office lead has open threads, shared documents, half-updated checklists, and several promises people think someone else already handled. The meeting is tomorrow morning. No one has a clean status view.",
          evidenceLabel: "The starting state",
          evidence: { kind: "doc", html: "<strong>The ask</strong><br>Pull together what is done, what is still missing, who owns each item, and what needs a follow-up before tomorrow's office meeting.<br><br><em>The answer is spread across email, notes, and shared files.</em>" }
        },
        {
          tag: "Stage 02 - Claude prepares",
          title: "Search checks the threads and source material.",
          text: "Claude searches across the working material, pulls the status lines into one place, and separates confirmed facts from items that still need a person to verify.",
          evidenceLabel: "Search and source review",
          evidence: { kind: "image", src: "./images/cowork-video-intro-frame.png", alt: "Search and source review surface in action." }
        },
        {
          tag: "Stage 03 - Claude prepares",
          title: "One briefing, one missing-items list, one owner table.",
          text: "The output is a shareable office brief: what is complete, what is still missing, what needs follow-up tonight, and which person owns each next step.",
          evidenceLabel: "Prepared office brief",
          evidence: { kind: "doc", html: "<strong>Brief structure</strong><ul><li>What is done</li><li>What is still missing</li><li>Who owns each open item</li><li>What needs follow-up before tomorrow</li><li>Questions Claude could not settle on its own</li></ul>" }
        },
        {
          tag: "Stage 04 - Human review",
          title: "The office lead checks the missing items and the owners.",
          text: "The lead reviews the briefing, confirms what is truly still open, and corrects anything Claude could not know from the files alone. This keeps the office from walking into the meeting with a false sense of completion.",
          evidenceLabel: "What gets checked",
          evidence: { kind: "doc", html: "<strong>Review surface</strong><ul><li>Are the missing items still truly outstanding?</li><li>Is ownership assigned to the right person?</li><li>Did Claude miss any nuance in the thread or checklist?</li><li>What should be followed up today versus tomorrow?</li></ul>" },
          isReview: true
        },
        {
          tag: "Stage 05 - The meeting",
          title: "The office starts with a clear picture instead of a scramble.",
          text: "By the end of review, the office lead has a short, accurate briefing and a follow-up list for the last loose ends. Claude did the reassembly. The office lead still decides what is real, what gets shared, and what needs escalation.",
          evidenceLabel: "What lands",
          evidence: { kind: "doc", html: "<strong>Outcome</strong><br>- Tomorrow starts with one clear status brief<br>- Missing items are visible before the meeting begins<br>- Owners and follow-ups are named in advance<br><br><em>The office spends the meeting moving work forward instead of reconstructing what happened.</em>" },
          isFinal: true
        }
      ],
      coda: {
        why:    "When the answer is scattered across tools and people, the main lift is reassembly. Claude can do that quickly and hand back a briefing shaped for review.",
        review: "The office lead still validates the status, the ownership, and what should actually be surfaced. Claude prepares the picture; the human confirms it."
      }
    }
  };

  const faqData = [
    {
      key: "privacy",
      question: "What about privacy and access?",
      answer: "Access should be intentional, not unlimited. You decide what information is shared, keep permissions tight, and keep review points in place for anything sensitive.",
      footnote: "The honest version: this is controlled use for a defined task, not blanket access to everything."
    },
    {
      key: "accuracy",
      question: "What if Claude makes mistakes?",
      answer: "It can. AI is very useful and still imperfect. That's why a human reviews important details — dates, numbers, contract specifics, regulated language — before anything is sent or relied on.",
      footnote: "The honest version: you're reviewing a prepared draft instead of building from scratch — both faster and safer."
    },
    {
      key: "replacement",
      question: "Does Claude replace staff?",
      answer: "No. Frame it as support, not replacement. Claude handles drafting, organizing, and follow-up so people can spend more time on judgment, client care, and the parts of the job that need a person.",
      footnote: "The honest version: remove admin drag first, then judge the real value."
    },
    {
      key: "approval",
      question: "Should Claude do important things on its own?",
      answer: "Not without explicit setup. Important steps should stay behind a human approval point. Claude can line everything up — but a person decides the output is ready before anything ships.",
      footnote: "The honest version: useful autonomy starts after the team decides where the review point sits."
    },
    {
      key: "manual",
      question: "Why not just do it manually?",
      answer: "You still can. The difference is that Claude can prepare the work in seconds, so people spend their time reviewing and judging instead of retyping and reorganizing.",
      footnote: "The honest version: use human effort where judgment matters most."
    }
  ];

  // ============================================================
  // DOM lookups
  // ============================================================
  const viewport = document.getElementById("viewport");
  const chapterNav = document.getElementById("chapterNav");
  const progressRail = document.getElementById("progressRail");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const prevTarget = document.getElementById("prevTarget");
  const nextTarget = document.getElementById("nextTarget");
  const currentNum = document.getElementById("currentNum");
  const currentName = document.getElementById("currentName");
  const progressLabel = document.getElementById("progressLabel");
  const overviewGrid = document.getElementById("overviewGrid");

  let currentIdx = 0;
  const visited = new Set([0]);

  // ============================================================
  // BUILD: chapter nav + progress dots + overview grid
  // ============================================================
  function buildChrome() {
    // Sidebar chapter nav
    chapterNav.innerHTML = chapters.map((c, i) => `
      <button class="chapter-link" type="button" data-idx="${i}" data-chapter="${c.key}">
        <span class="ch-link-num">${c.num}</span>
        <span class="ch-link-title">${c.title}</span>
        <span class="ch-link-check" aria-hidden="true">✓</span>
      </button>
    `).join("");

    chapterNav.querySelectorAll(".chapter-link").forEach((btn) => {
      btn.addEventListener("click", () => goTo(parseInt(btn.dataset.idx, 10)));
    });

    // Progress dots in topbar
    progressRail.innerHTML = chapters.map((c, i) => `
      <li>
        <button class="progress-step" type="button" data-idx="${i}" title="${c.title}" aria-label="Open chapter ${c.num}: ${c.title}">
          <span class="progress-dot" aria-hidden="true"></span>
          <span class="progress-step-num">${c.num}</span>
        </button>
      </li>
    `).join("");

    progressRail.querySelectorAll(".progress-step").forEach((step) => {
      step.addEventListener("click", () => goTo(parseInt(step.dataset.idx, 10)));
    });

    // Overview grid (in welcome chapter)
    overviewGrid.innerHTML = chapters.map((c, i) => `
      <li>
        <button class="overview-card" type="button" data-idx="${i}" aria-label="Open chapter ${c.num}: ${c.title}">
          <span class="ov-num">CH ${c.num}</span>
          <span class="ov-title">${c.title}</span>
          <span class="ov-time">${c.duration}</span>
        </button>
      </li>
    `).join("");

    overviewGrid.querySelectorAll(".overview-card").forEach((card) => {
      card.addEventListener("click", () => goTo(parseInt(card.dataset.idx, 10)));
    });
  }

  // ============================================================
  // ROUTE: change chapter
  // ============================================================
  function goTo(idx) {
    if (idx < 0 || idx >= chapters.length || idx === currentIdx) return;

    const prevChapter = viewport.querySelector(".chapter.is-current");
    const target = chapters[idx];
    const nextSection = document.getElementById("ch-" + target.key);
    if (!nextSection) return;

    if (prevChapter) prevChapter.classList.remove("is-current");
    nextSection.classList.add("is-current");

    currentIdx = idx;
    visited.add(idx);
    updateChrome();
    syncHash();
    const heading = nextSection.querySelector("h1, h2, h3");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    // scroll viewport to top of chapter
    if (viewport) {
      viewport.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  function updateChrome() {
    // sidebar
    chapterNav.querySelectorAll(".chapter-link").forEach((btn) => {
      const i = parseInt(btn.dataset.idx, 10);
      btn.classList.toggle("is-current", i === currentIdx);
      btn.classList.toggle("is-done", i < currentIdx);
    });

    // progress dots
    progressRail.querySelectorAll(".progress-step").forEach((step) => {
      const i = parseInt(step.dataset.idx, 10);
      step.classList.toggle("is-current", i === currentIdx);
      step.classList.toggle("is-done", i < currentIdx);
      if (i === currentIdx) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });

    // footbar
    const cur = chapters[currentIdx];
    currentNum.textContent = cur.num;
    currentName.textContent = cur.title;
    progressLabel.textContent = (currentIdx + 1) + " of " + chapters.length;

    // prev/next
    prevBtn.disabled = currentIdx === 0;
    nextBtn.disabled = currentIdx === chapters.length - 1;
    prevTarget.textContent = currentIdx > 0 ? chapters[currentIdx - 1].short : "—";
    nextTarget.textContent = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1].short : "Done";

    // primary CTA "Begin" inside welcome — update its sub-label
    const welcomeCta = document.querySelector('[data-action="next"]');
    if (welcomeCta) {
      const sub = welcomeCta.querySelector(".cta-sub");
      if (sub) sub.textContent = "Chapter " + chapters[1].num + " · " + chapters[1].title;
    }
  }

  function syncHash() {
    const key = chapters[currentIdx].key;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + key);
    }
  }

  function readHash() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (!hash) return 0;
    if (hash === "overview") return 0;
    const idx = chapters.findIndex((c) => c.key === hash);
    return idx >= 0 ? idx : 0;
  }

  // ============================================================
  // CHAPTER 2 · brief comparator
  // ============================================================
  const briefBtns = document.querySelectorAll("[data-brief]");
  const briefCard = document.getElementById("briefCard");
  const briefOut = document.getElementById("briefOut");
  const briefNote = document.getElementById("briefNote");

  function renderBrief(key) {
    const data = briefData[key];
    if (!data) return;

    briefBtns.forEach((b) => {
      const active = b.dataset.brief === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });

    // Render the prompt
    briefCard.classList.toggle("is-thick", key === "thick");
    if (typeof data.prompt === "string") {
      briefCard.innerHTML = data.prompt;
    } else {
      briefCard.innerHTML = data.prompt
        .map((line) => `<span class="brief-line"><strong>${line.label}:</strong>${line.line}</span>`)
        .join("");
    }

    // Render the output
    briefOut.innerHTML = data.reply
      .map((p) => `<${p.tag}>${p.text}</${p.tag}>`)
      .join("");

    briefNote.textContent = data.note;
  }

  briefBtns.forEach((b) => {
    b.addEventListener("click", () => renderBrief(b.dataset.brief));
  });

  // ============================================================
  // CHAPTER 3 · atlas tiles → detail panel
  // ============================================================
  const tileBtns = document.querySelectorAll(".tile[data-surface]");
  const atlasDetail = document.getElementById("atlasDetail");

  function renderAtlas(key) {
    const data = atlasData[key];
    if (!data) return;

    tileBtns.forEach((t) => {
      t.classList.toggle("is-active", t.dataset.surface === key);
    });

    atlasDetail.innerHTML = `
      <p class="ad-tag">${data.tag}</p>
      <h3 class="ad-title">${data.title}</h3>
      <p class="ad-lede">${data.lede}</p>
      <div class="ad-section">
        <p class="ad-section-label">Good for</p>
        <ul class="ad-list">${data.good.map((g) => `<li>${g}</li>`).join("")}</ul>
      </div>
      <div class="ad-bridge">${data.bridge}</div>
    `;
  }

  tileBtns.forEach((t) => {
    t.addEventListener("click", () => renderAtlas(t.dataset.surface));
  });

  // ============================================================
  // CHAPTER 4 · case files
  // ============================================================
  const caseTabs = document.querySelectorAll(".case-tab[data-case]");
  const caseFile = document.getElementById("caseFile");

  function renderCase(key) {
    const data = caseData[key];
    if (!data) return;

    caseTabs.forEach((t) => {
      const active = t.dataset.case === key;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });

    const stagesHtml = data.stages.map((s, i) => {
      const stageClass = s.isReview ? "stage stage-review" : (s.isFinal ? "stage stage-final" : "stage");
      const evHtml = s.evidence.kind === "image"
        ? `<div class="evidence-frame"><img src="${s.evidence.src}" alt="${s.evidence.alt || ""}" loading="lazy"></div>`
        : `<div class="evidence-doc">${s.evidence.html}</div>`;

      return `
        <article class="${stageClass}">
          <div class="stage-num">${String(i + 1).padStart(2, "0")}</div>
          <div class="stage-body">
            <p class="stage-tag">${s.tag}</p>
            <h3 class="stage-title">${s.title}</h3>
            <p class="stage-text">${s.text}</p>
          </div>
          <div class="stage-evidence">
            <p class="evidence-label">${s.evidenceLabel}</p>
            ${evHtml}
          </div>
        </article>
      `;
    }).join("");

    caseFile.innerHTML = `
      <div class="case-meta-strip">
        ${data.meta.meta.map((m) => `
          <div class="case-meta-item">
            <span class="case-meta-label">${m.label}</span>
            <span class="case-meta-value">${m.value}</span>
          </div>
        `).join("")}
      </div>

      <header class="case-head">
        <h2 class="case-title" style="font-family:var(--serif);font-size:clamp(1.6rem,1.3rem+1vw,2.2rem);font-weight:500;letter-spacing:-0.022em;line-height:1.15;margin-bottom:12px;">${data.meta.title}</h2>
        <p class="case-lede" style="font-size:15px;color:var(--ink-soft);line-height:1.6;max-width:62ch;">${data.meta.lede}</p>
      </header>

      <div class="case-stages">${stagesHtml}</div>

      <div class="case-coda">
        <div class="coda-block">
          <p class="coda-label">Why this works</p>
          <p>${data.coda.why}</p>
        </div>
        <div class="coda-block">
          <p class="coda-label">Where review stays</p>
          <p>${data.coda.review}</p>
        </div>
      </div>
    `;
  }

  caseTabs.forEach((t) => {
    t.addEventListener("click", () => renderCase(t.dataset.case));
  });

  // ============================================================
  // CHAPTER 6 · FAQ accordion
  // ============================================================
  const faqList = document.getElementById("faqList");

  function renderFaq() {
    faqList.innerHTML = faqData.map((f, i) => `
      <div class="faq-item" data-faq="${f.key}">
        <button class="faq-trigger" type="button" aria-expanded="false">
          <span class="faq-num">Q · ${String(i + 1).padStart(2, "0")}</span>
          <span class="faq-question">${f.question}</span>
          <span class="faq-toggle" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </span>
        </button>
        <div class="faq-body">
          <div class="faq-body-inner">
            <div class="faq-body-pad">
              <p class="faq-answer">${f.answer}</p>
              <p class="faq-footnote">${f.footnote}</p>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    faqList.querySelectorAll(".faq-item").forEach((item) => {
      const trigger = item.querySelector(".faq-trigger");
      trigger.addEventListener("click", () => {
        const open = item.classList.contains("is-open");
        item.classList.toggle("is-open", !open);
        trigger.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });
  }

  // ============================================================
  // CHAPTER 7 · copy-to-clipboard for the prompt template
  // ============================================================
  const copyBtn = document.getElementById("copyBtn");
  const promptBody = document.getElementById("promptBody");

  if (copyBtn && promptBody) {
    copyBtn.addEventListener("click", async () => {
      const text = promptBody.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        // Fallback for older browsers / file:// where clipboard API may be blocked
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (_) {}
        document.body.removeChild(ta);
      }
      copyBtn.classList.add("is-copied");
      const label = copyBtn.querySelector(".copy-label");
      const original = label.textContent;
      label.textContent = "Copied";
      setTimeout(() => {
        copyBtn.classList.remove("is-copied");
        label.textContent = original;
      }, 1600);
    });
  }

  // ============================================================
  // Hero CTAs + keyboard nav
  // ============================================================
  document.querySelectorAll('[data-action="next"]').forEach((b) => {
    b.addEventListener("click", () => goTo(currentIdx + 1));
  });

  document.querySelectorAll('[data-action="jump-overview"]').forEach((b) => {
    b.addEventListener("click", () => {
      const ov = document.getElementById("overview");
      if (ov) ov.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  prevBtn.addEventListener("click", () => goTo(currentIdx - 1));
  nextBtn.addEventListener("click", () => goTo(currentIdx + 1));

  window.addEventListener("keydown", (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (e.target.closest('[role="tablist"]')) return;
    if (e.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
    if (e.key === "ArrowRight" || e.key === "j") { goTo(currentIdx + 1); }
    else if (e.key === "ArrowLeft" || e.key === "k") { goTo(currentIdx - 1); }
  });

  window.addEventListener("hashchange", () => {
    const idx = readHash();
    if (idx !== currentIdx) goTo(idx);
  });

  // ============================================================
  // INIT
  // ============================================================
  buildChrome();
  renderBrief("thin");
  renderAtlas("chat");
  renderCase("realtor");
  renderFaq();

  const startIdx = readHash();
  if (startIdx !== 0) {
    // hide welcome, show target
    const welcome = document.getElementById("ch-welcome");
    if (welcome) welcome.classList.remove("is-current");
    const target = document.getElementById("ch-" + chapters[startIdx].key);
    if (target) target.classList.add("is-current");
    currentIdx = startIdx;
    visited.add(startIdx);
  }
  updateChrome();
})();
