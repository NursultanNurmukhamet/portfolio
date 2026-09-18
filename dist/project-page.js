const params = new URLSearchParams(window.location.search);
const requestedId = params.get("id") || "project-01";
const slots = window.PORTFOLIO_BLUEPRINT?.projectSlots || [];
const activeSlot = slots.find((slot) => slot.id === requestedId) || slots[0];

const numberTargets = document.querySelectorAll("[data-project-number]");
numberTargets.forEach((target) => {
  target.textContent = activeSlot?.number || "01";
});

const idTarget = document.querySelector("[data-project-id]");
if (idTarget) idTarget.textContent = activeSlot?.id || "project-01";
