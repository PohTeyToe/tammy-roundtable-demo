(function () {
  const notesToggle = document.getElementById("notesToggle");
  const presenterToggle = document.getElementById("presenterToggle");
  const resetView = document.getElementById("resetView");
  const navLinks = Array.from(document.querySelectorAll("[data-nav-target]"));
  const sections = Array.from(document.querySelectorAll("[data-section]"));
  const revealSections = Array.from(document.querySelectorAll(".reveal"));
  const proofTriggers = Array.from(document.querySelectorAll("[data-proof]"));
  const faqTriggers = Array.from(document.querySelectorAll("[data-faq]"));
  const proofStageFrame = document.getElementById("proofStageFrame");
  const proofStageImage = document.getElementById("proofStageImage");
  const proofStageKicker = document.getElementById("proofStageKicker");
  const proofStageTitle = document.getElementById("proofStageTitle");
  const proofStageDescription = document.getElementById("proofStageDescription");
  const proofStageQuote = document.getElementById("proofStageQuote");
  const proofStageCopy = document.querySelector(".proof-stage-copy");
  const faqKicker = document.getElementById("faqKicker");
  const faqTitle = document.getElementById("faqTitle");
  const faqBody = document.getElementById("faqBody");
  const faqQuote = document.getElementById("faqQuote");
  const faqPanel = document.querySelector(".faq-panel");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxClose = document.getElementById("lightboxClose");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const proofMap = {
    file: {
      src: "./images/workflow-file.png",
      alt: "Google Drive transaction folder created from the realtor workflow.",
      kicker: "File",
      title: "The folder is ready from the agreement.",
      description:
        "The file is already landing in the right place instead of being set up by hand.",
      quote:
        "What Tammy can say: \"The folder is already ready. That saves the setup step.\""
    },
    record: {
      src: "./images/workflow-record.png",
      alt: "Trade record dashboard showing a prepared transaction row from the realtor workflow.",
      kicker: "Record",
      title: "The trade record is already started.",
      description:
        "The agreement details are already in place. The realtor is checking, not rebuilding.",
      quote:
        "What Tammy can say: \"Instead of starting from a blank row, the record is already there to review.\""
    },
    remind: {
      src: "./images/workflow-remind.png",
      alt: "Calendar reminders created from the realtor workflow for transaction deadlines.",
      kicker: "Remind",
      title: "Dates turn into reminders right away.",
      description:
        "The dates do not stay buried in the document. They become visible next steps.",
      quote:
        "What Tammy can say: \"This helps make sure the next deadline is already on the calendar.\""
    },
    reply: {
      src: "./images/workflow-reply.png",
      alt: "Gmail drafts created from the realtor workflow for transaction follow-up.",
      kicker: "Reply",
      title: "The next email is drafted and waiting.",
      description:
        "The follow-up is lined up, but the realtor still decides what gets sent.",
      quote:
        "What Tammy can say: \"The draft is ready, but the realtor still checks it before it goes anywhere.\""
    }
  };

  const faqMap = {
    privacy: {
      kicker: "Short answer",
      title: "Only the right files should be in play.",
      body:
        "Access stays tight. You decide what is shared and where the review points sit.",
      quote:
        "What Tammy can say: \"This is not every file by default. It is a specific workflow with specific review points.\""
    },
    accuracy: {
      kicker: "Short answer",
      title: "It still needs checking.",
      body:
        "Claude can give you a strong first pass, but the person handling the deal still checks the important details.",
      quote:
        "What Tammy can say: \"If it matters, you still check it. The difference is that you are reviewing prepared work.\""
    },
    manual: {
      kicker: "Short answer",
      title: "You still can do it manually.",
      body:
        "The difference is where the time goes: less retyping, more review.",
      quote:
        "What Tammy can say: \"You can still do it by hand. This just moves the work from retyping to reviewing.\""
    },
    replacement: {
      kicker: "Short answer",
      title: "This is support, not replacement.",
      body:
        "The workflow helps with drafting, organizing, reminders, and follow-up so more time can go to judgment and client service.",
      quote:
        "What Tammy can say: \"This helps with the admin layer so people can spend more time on the parts that need judgment.\""
    },
    developer: {
      kicker: "Short answer",
      title: "This page is about transaction work.",
      body:
        "Claude also has developer tooling, but that is not this story. This one is about agreements, records, reminders, and follow-up.",
      quote:
        "What Tammy can say: \"The software side exists, but for this room the story is transaction work.\""
    }
  };

  initNotesToggle();
  initPresenterToggle();
  initReset();
  initSmoothScroll();
  initActiveSectionObserver();
  initRevealObserver();
  initProofDeck();
  initFaqDeck();
  initLightbox();

  function initNotesToggle() {
    if (!notesToggle) {
      return;
    }

    notesToggle.addEventListener("click", function () {
      const nextState = document.body.getAttribute("data-notes") === "on" ? "off" : "on";
      document.body.setAttribute("data-notes", nextState);
      notesToggle.setAttribute("aria-pressed", nextState === "on" ? "true" : "false");
      notesToggle.textContent = "Notes " + nextState;
    });
  }

  function initPresenterToggle() {
    if (!presenterToggle) {
      return;
    }

    presenterToggle.addEventListener("click", function () {
      const nextState = document.body.getAttribute("data-presenter") === "on" ? "off" : "on";
      document.body.setAttribute("data-presenter", nextState);
      presenterToggle.setAttribute("aria-pressed", nextState === "on" ? "true" : "false");
      presenterToggle.textContent = "Presenter " + nextState;
    });
  }

  function initReset() {
    if (!resetView) {
      return;
    }

    resetView.addEventListener("click", function () {
      document.body.setAttribute("data-notes", "off");
      document.body.setAttribute("data-presenter", "off");

      if (notesToggle) {
        notesToggle.setAttribute("aria-pressed", "false");
        notesToggle.textContent = "Notes off";
      }

      if (presenterToggle) {
        presenterToggle.setAttribute("aria-pressed", "false");
        presenterToggle.textContent = "Presenter off";
      }

      setProof("file");
      setFaq("privacy");
      closeLightbox();
      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth"
      });
    });
  }

  function initSmoothScroll() {
    navLinks.forEach((link) => {
      link.addEventListener("click", function (event) {
        const targetId = link.getAttribute("data-nav-target");
        const target = document.getElementById(targetId);
        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  }

  function initActiveSectionObserver() {
    if (!sections.length || !navLinks.length) {
      return;
    }

    const ratios = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let activeId = sections[0].id;
        let highestRatio = -1;

        sections.forEach((section) => {
          const ratio = ratios.get(section.id) || 0;
          if (ratio > highestRatio) {
            highestRatio = ratio;
            activeId = section.id;
          }
        });

        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("data-nav-target") === activeId);
        });
      },
      {
        rootMargin: "-18% 0px -52% 0px",
        threshold: [0, 0.2, 0.4, 0.6]
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initRevealObserver() {
    revealSections.forEach((section) => section.classList.add("is-visible"));
  }

  function initProofDeck() {
    if (!proofTriggers.length) {
      return;
    }

    proofTriggers.forEach((trigger) => {
      trigger.addEventListener("click", function () {
        setProof(trigger.getAttribute("data-proof"));
      });
    });

    setProof("file");
  }

  function setProof(key) {
    const item = proofMap[key];
    if (!item) {
      return;
    }

    proofTriggers.forEach((trigger) => {
      const isActive = trigger.getAttribute("data-proof") === key;
      trigger.classList.toggle("active", isActive);
      trigger.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    proofStageImage.src = item.src;
    proofStageImage.alt = item.alt;
    animateSwap(proofStageCopy);
    proofStageKicker.textContent = item.kicker;
    proofStageTitle.textContent = item.title;
    proofStageDescription.textContent = item.description;
    proofStageQuote.textContent = item.quote;
  }

  function initFaqDeck() {
    if (!faqTriggers.length) {
      return;
    }

    faqTriggers.forEach((trigger) => {
      trigger.addEventListener("click", function () {
        setFaq(trigger.getAttribute("data-faq"));
      });
    });

    setFaq("privacy");
  }

  function setFaq(key) {
    const item = faqMap[key];
    if (!item) {
      return;
    }

    faqTriggers.forEach((trigger) => {
      const isActive = trigger.getAttribute("data-faq") === key;
      trigger.classList.toggle("active", isActive);
      trigger.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    faqKicker.textContent = item.kicker;
    animateSwap(faqPanel);
    faqTitle.textContent = item.title;
    faqBody.textContent = item.body;
    faqQuote.textContent = item.quote;
  }

  function animateSwap(element) {
    if (!element || reducedMotion) {
      return;
    }

    element.classList.remove("is-swapping");
    window.requestAnimationFrame(function () {
      element.classList.add("is-swapping");
      window.setTimeout(function () {
        element.classList.remove("is-swapping");
      }, 180);
    });
  }

  function initLightbox() {
    if (!proofStageFrame || !lightbox || !lightboxImage || !lightboxClose) {
      return;
    }

    proofStageFrame.addEventListener("click", openLightbox);
    proofStageFrame.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox();
      }
    });

    lightbox.addEventListener("click", closeLightbox);
    lightboxClose.addEventListener("click", function (event) {
      event.stopPropagation();
      closeLightbox();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox();
      }
    });
  }

  function openLightbox() {
    lightboxImage.src = proofStageImage.src;
    lightboxImage.alt = proofStageImage.alt;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    lightboxImage.alt = "";
  }
})();
