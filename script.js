const intro = document.querySelector("#intro");
const introLines = [...document.querySelectorAll(".intro-line")];
const skipIntro = document.querySelector("#skipIntro");
const apologyPage = document.querySelector("#apologyPage");
const acceptButton = document.querySelector("#acceptButton");
const notYetButton = document.querySelector("#notYetButton");
const buttonHint = document.querySelector("#buttonHint");
const acceptedModal = document.querySelector("#acceptedModal");
const spaceModal = document.querySelector("#spaceModal");
const closeModal = document.querySelector("#closeModal");
const closeSpaceModal = document.querySelector("#closeSpaceModal");
const confettiTemplate = document.querySelector("#confettiPiece");
const cursorGlow = document.querySelector(".cursor-glow");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const timers = [];
let introFinished = false;
let escapeCount = 0;
let buttonIsRunning = false;
let lastPointer = { x: 0, y: 0 };

const escapeMessages = [
  "Okay, I deserved that little escape.",
  "Still thinking? That’s fair.",
  "No pressure — but this button is shy.",
  "I’ll keep trying to make things right.",
  "Take your time. I mean it."
];

function applyPersonalisation() {
  const params = new URLSearchParams(window.location.search);
  const recipient = params.get("to")?.trim();
  const sender = params.get("from")?.trim();
  const reason = params.get("reason")?.trim();

  if (recipient) {
    document.querySelector("#salutation").textContent = `Dear ${recipient},`;
    document.title = `A small sorry for ${recipient}`;
  }

  if (sender) {
    document.querySelector("#senderName").textContent = sender;
  }

  if (reason) {
    document.querySelector("#apologyReason").textContent =
      `I’m sorry for ${reason}. It was careless, and I understand that words can stay with someone long after the moment has passed.`;
  }
}

function setDate() {
  document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  timers.forEach(window.clearTimeout);
  introLines.forEach((line) => line.classList.remove("is-visible"));
  intro.classList.add("is-finished");
  skipIntro.classList.add("is-hidden");
  apologyPage.classList.add("is-visible");
  apologyPage.setAttribute("aria-hidden", "false");
  apologyPage.removeAttribute("inert");
  window.setTimeout(() => {
    intro.hidden = true;
    skipIntro.hidden = true;
  }, 850);
}

function playIntro() {
  if (reducedMotion) {
    finishIntro();
    return;
  }

  introLines.forEach((line, index) => {
    timers.push(window.setTimeout(() => {
      introLines.forEach((item) => {
        item.classList.remove("is-visible");
        item.classList.add("is-leaving");
      });
      line.classList.remove("is-leaving");
      line.classList.add("is-visible");
    }, index * 1450 + 300));
  });

  timers.push(window.setTimeout(finishIntro, introLines.length * 1450 + 1000));
}

function openModal(modal, focusTarget) {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  window.setTimeout(() => focusTarget.focus(), 120);
}

function closeResponseModal(modal, returnFocus) {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  returnFocus.focus();
}

function launchConfetti() {
  const colors = ["#d96476", "#f4a1a9", "#4b1f4e", "#f7c96b", "#fff9f2"];
  const count = reducedMotion ? 0 : 70;

  for (let index = 0; index < count; index += 1) {
    const piece = confettiTemplate.content.firstElementChild.cloneNode();
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty("--drift-x", `${Math.random() * 12 - 6}rem`);
    piece.style.setProperty("--spin", `${Math.random() * 900 - 450}deg`);
    piece.style.setProperty("--fall-duration", `${2 + Math.random() * 1.8}s`);
    piece.style.animationDelay = `${Math.random() * 0.45}s`;
    piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "0.1rem";
    document.body.append(piece);
    window.setTimeout(() => piece.remove(), 4300);
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function positionRunawayButton(pointerX, pointerY) {
  const rect = notYetButton.getBoundingClientRect();
  const padding = 18;
  const maxLeft = Math.max(padding, window.innerWidth - rect.width - padding);
  const maxTop = Math.max(padding, window.innerHeight - rect.height - padding);
  let bestPosition = null;
  let bestDistance = -1;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = {
      left: padding + Math.random() * (maxLeft - padding),
      top: padding + Math.random() * (maxTop - padding)
    };
    const centerX = candidate.left + rect.width / 2;
    const centerY = candidate.top + rect.height / 2;
    const distance = Math.hypot(centerX - pointerX, centerY - pointerY);

    if (distance > bestDistance) {
      bestDistance = distance;
      bestPosition = candidate;
    }
  }

  const nextLeft = clamp(bestPosition.left, padding, maxLeft);
  const nextTop = clamp(bestPosition.top, padding, maxTop);
  notYetButton.style.left = `${nextLeft}px`;
  notYetButton.style.top = `${nextTop}px`;
  escapeCount += 1;
  buttonHint.textContent = escapeMessages[Math.min(escapeCount - 1, escapeMessages.length - 1)];
}

function startRunning(pointerX, pointerY) {
  if (!buttonIsRunning) {
    const rect = notYetButton.getBoundingClientRect();
    document.body.append(notYetButton);
    notYetButton.classList.add("is-running");
    notYetButton.style.left = `${rect.left}px`;
    notYetButton.style.top = `${rect.top}px`;
    buttonIsRunning = true;
  }
  positionRunawayButton(pointerX, pointerY);
}

function handlePointerMove(event) {
  if (event.pointerType && event.pointerType !== "mouse") return;
  lastPointer = { x: event.clientX, y: event.clientY };
  document.body.classList.add("has-pointer");
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;

  if (!buttonIsRunning) return;
  const rect = notYetButton.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const distance = Math.hypot(centerX - event.clientX, centerY - event.clientY);
  if (distance < 125) {
    positionRunawayButton(event.clientX, event.clientY);
  }
}

skipIntro.addEventListener("click", finishIntro);

acceptButton.addEventListener("click", () => {
  launchConfetti();
  openModal(acceptedModal, closeModal);
});

notYetButton.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "mouse") {
    startRunning(event.clientX, event.clientY);
  }
});

notYetButton.addEventListener("click", () => {
  openModal(spaceModal, closeSpaceModal);
});

closeModal.addEventListener("click", () => closeResponseModal(acceptedModal, acceptButton));
closeSpaceModal.addEventListener("click", () => closeResponseModal(spaceModal, notYetButton));

[acceptedModal, spaceModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      const isAccepted = modal === acceptedModal;
      closeResponseModal(modal, isAccepted ? acceptButton : notYetButton);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (acceptedModal.classList.contains("is-open")) {
    closeResponseModal(acceptedModal, acceptButton);
  }
  if (spaceModal.classList.contains("is-open")) {
    closeResponseModal(spaceModal, notYetButton);
  }
});

document.addEventListener("pointermove", handlePointerMove, { passive: true });

window.addEventListener("resize", () => {
  if (buttonIsRunning) {
    positionRunawayButton(lastPointer.x, lastPointer.y);
  }
});

applyPersonalisation();
setDate();
playIntro();
