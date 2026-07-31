// ==========================================
// BONUS MODAL LOGIC
// ==========================================
let activeBonusInputTarget = null;
let currentRascalBet = 0;
let isAllianceActive = false;

const bonusModal = document.getElementById("bonus-modal");
const closeBonusModalBtn = document.getElementById("close-bonus-modal");
const applyBonusBtn = document.getElementById("apply-bonus-btn");
const expansionCategory = document.getElementById("expansion-category");
const bonusPreview = document.getElementById("bonus-preview");

const allianceToggleBtn = document.getElementById("alliance-toggle-btn");
const alliancePartnerSelect = document.getElementById(
  "alliance-partner-select",
);

// Counter buttons logic (+ / -)
document.querySelectorAll(".counter-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = btn.dataset.target;
    const direction = parseInt(btn.dataset.dir);
    const targetInput = document.getElementById(targetId);

    if (targetInput) {
      let val = parseInt(targetInput.value) || 0;
      let maxVal = parseInt(targetInput.dataset.max);

      if (targetId === "pirates-captured") {
        const expansionToggle = document.querySelector(
          "#expansion input[type='checkbox']",
        );
        maxVal = expansionToggle && expansionToggle.checked ? 6 : 5;
      }

      val += direction;
      if (val < 0) val = 0;
      if (!isNaN(maxVal) && val > maxVal) val = maxVal;

      targetInput.value = val;
      calculateModalTotal();
    }
  });
});

// Rascal Bet Button Toggles (+10 / +20)
document.querySelectorAll(".rascal-btn[data-value]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const val = parseInt(btn.dataset.value);

    if (currentRascalBet === val) {
      currentRascalBet = 0;
      btn.classList.remove("active");
    } else {
      currentRascalBet = val;
      document
        .querySelectorAll(".rascal-btn[data-value]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }

    calculateModalTotal();
  });
});

// Alliance Toggle Button & Partner Select
if (allianceToggleBtn) {
  allianceToggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    isAllianceActive = !isAllianceActive;
    updateAllianceUI();
    calculateModalTotal();
  });
}

if (alliancePartnerSelect) {
  alliancePartnerSelect.addEventListener("change", calculateModalTotal);
}

function updateAllianceUI() {
  if (isAllianceActive) {
    allianceToggleBtn.textContent = "On";
    allianceToggleBtn.classList.add("active");
    alliancePartnerSelect.classList.remove("hidden");
  } else {
    allianceToggleBtn.textContent = "Off";
    allianceToggleBtn.classList.remove("active");
    alliancePartnerSelect.classList.add("hidden");
    alliancePartnerSelect.value = "";
  }
}

function populateAlliancePartners(activePlayerIndex) {
  alliancePartnerSelect.innerHTML =
    '<option value="">Partner</option>';

  players.forEach((p, index) => {
    if (index !== activePlayerIndex) {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = p.name;
      alliancePartnerSelect.appendChild(option);
    }
  });
}

// Calculate Total Bonus Preview inside Modal
function calculateModalTotal() {
  let total = 0;

  // Standard Items
  total += (parseInt(document.getElementById("std-14s").value) || 0) * 10;
  total += (parseInt(document.getElementById("black-14").value) || 0) * 20;
  total +=
    (parseInt(document.getElementById("pirates-captured").value) || 0) * 30;
  total +=
    (parseInt(document.getElementById("mermaids-captured").value) || 0) * 20;
  total += (parseInt(document.getElementById("sk-by-mermaid").value) || 0) * 40;

  if (isAllianceActive && alliancePartnerSelect.value !== "") {
    total += 20;
  }

  total += currentRascalBet;

  // Expansion Items (if enabled)
  const expansionToggle = document.querySelector(
    "#expansion input[type='checkbox']",
  );
  if (expansionToggle && expansionToggle.checked) {
    if (document.getElementById("exp-8").checked) total += 5;
    if (document.getElementById("exp-7").checked) total -= 5;
    if (document.getElementById("first-mate").checked) total += 30;
    total +=
      (parseInt(document.getElementById("sea-monsters").value) || 0) * 20;
  }

  if (bonusPreview) bonusPreview.textContent = total;
  return total;
}

// Get current state object from modal fields
function getModalState() {
  const partnerIndex =
    alliancePartnerSelect.value !== ""
      ? parseInt(alliancePartnerSelect.value)
      : null;

  return {
    std14s: parseInt(document.getElementById("std-14s").value) || 0,
    black14: parseInt(document.getElementById("black-14").value) || 0,
    piratesCaptured:
      parseInt(document.getElementById("pirates-captured").value) || 0,
    mermaidsCaptured:
      parseInt(document.getElementById("mermaids-captured").value) || 0,
    skByMermaid: parseInt(document.getElementById("sk-by-mermaid").value) || 0,
    allianceActive: isAllianceActive,
    alliancePartnerIndex: partnerIndex,
    rascalBet: currentRascalBet,
    exp8: document.getElementById("exp-8").checked,
    exp7: document.getElementById("exp-7").checked,
    firstMate: document.getElementById("first-mate").checked,
    seaMonsters: parseInt(document.getElementById("sea-monsters").value) || 0,
  };
}

// Populate modal fields from a saved state object
function populateModalForm(savedState, activePlayerIndex) {
  resetModalForm();
  populateAlliancePartners(activePlayerIndex);

  if (!savedState) return;

  document.getElementById("std-14s").value = Math.min(
    3,
    savedState.std14s || 0,
  );
  document.getElementById("black-14").value = Math.min(
    1,
    savedState.black14 || 0,
  );

  const expansionToggle = document.querySelector(
    "#expansion input[type='checkbox']",
  );
  const maxPirates = expansionToggle && expansionToggle.checked ? 6 : 5;
  document.getElementById("pirates-captured").value = Math.min(
    maxPirates,
    savedState.piratesCaptured || 0,
  );

  document.getElementById("mermaids-captured").value = Math.min(
    2,
    savedState.mermaidsCaptured || 0,
  );
  document.getElementById("sk-by-mermaid").value = Math.min(
    1,
    savedState.skByMermaid || 0,
  );

  isAllianceActive = !!savedState.allianceActive;
  if (
    savedState.alliancePartnerIndex !== null &&
    savedState.alliancePartnerIndex !== undefined
  ) {
    alliancePartnerSelect.value = savedState.alliancePartnerIndex;
  }
  updateAllianceUI();

  currentRascalBet = savedState.rascalBet || 0;
  if (currentRascalBet > 0) {
    const activeBtn = document.querySelector(
      `.rascal-btn[data-value="${currentRascalBet}"]`,
    );
    if (activeBtn) activeBtn.classList.add("active");
  }

  document.getElementById("exp-8").checked = !!savedState.exp8;
  document.getElementById("exp-7").checked = !!savedState.exp7;
  document.getElementById("first-mate").checked = !!savedState.firstMate;
  document.getElementById("sea-monsters").value = savedState.seaMonsters || 0;
}

// Bind listeners to recalculate dynamically on change
document.querySelectorAll("#bonus-modal input").forEach((elem) => {
  elem.addEventListener("change", calculateModalTotal);
});

function openBonusModal(targetInput, existingBonusData) {
  activeBonusInputTarget = targetInput;
  const playerCard = targetInput.closest(".player-round-card");
  const activePlayerIndex = playerCard
    ? parseInt(playerCard.dataset.playerIndex)
    : -1;

  populateModalForm(existingBonusData, activePlayerIndex);

  // Show Expansion section and set appropriate maxes
  const expansionToggle = document.querySelector(
    "#expansion input[type='checkbox']",
  );
  const isExpansionOn = expansionToggle && expansionToggle.checked;
  const piratesInput = document.getElementById("pirates-captured");

  if (isExpansionOn) {
    expansionCategory.classList.remove("hidden");
    piratesInput.dataset.max = "6";
  } else {
    expansionCategory.classList.add("hidden");
    piratesInput.dataset.max = "5";
    if (parseInt(piratesInput.value) > 5) piratesInput.value = "5";
  }

  calculateModalTotal();
  if (bonusModal) bonusModal.classList.remove("hidden");
}

function closeBonusModal() {
  if (bonusModal) bonusModal.classList.add("hidden");
  activeBonusInputTarget = null;
}

function resetModalForm() {
  document
    .querySelectorAll("#bonus-modal input[type='number']")
    .forEach((i) => (i.value = 0));
  document
    .querySelectorAll("#bonus-modal input[type='checkbox']")
    .forEach((i) => (i.checked = false));
  document
    .querySelectorAll(".rascal-btn[data-value]")
    .forEach((b) => b.classList.remove("active"));
  currentRascalBet = 0;
  isAllianceActive = false;
  updateAllianceUI();
}

// Event Listeners
if (closeBonusModalBtn)
  closeBonusModalBtn.addEventListener("click", closeBonusModal);

if (applyBonusBtn) {
  applyBonusBtn.addEventListener("click", () => {
    if (activeBonusInputTarget) {
      const activeCard = activeBonusInputTarget.closest(".player-round-card");
      const activePlayerIndex = activeCard
        ? parseInt(activeCard.dataset.playerIndex)
        : -1;

      const total = calculateModalTotal();
      const bonusData = getModalState();

      activeBonusInputTarget.value = total;
      activeBonusInputTarget.bonusData = bonusData;

      // Automatically mirror alliance selection to partner player if partner was chosen
      if (bonusData.allianceActive && bonusData.alliancePartnerIndex !== null) {
        const partnerIndex = bonusData.alliancePartnerIndex;
        const partnerCard = document.querySelector(
          `.player-round-card[data-player-index="${partnerIndex}"]`,
        );

        if (partnerCard) {
          const partnerBonusInput = partnerCard.querySelector(".bonus");
          let partnerData = partnerBonusInput.bonusData || {
            std14s: 0,
            black14: 0,
            piratesCaptured: 0,
            mermaidsCaptured: 0,
            skByMermaid: 0,
            rascalBet: 0,
            exp8: false,
            exp7: false,
            firstMate: false,
            seaMonsters: 0,
          };

          partnerData.allianceActive = true;
          partnerData.alliancePartnerIndex = activePlayerIndex;

          // Compute partner's raw total sum
          let partnerTotal = 0;
          partnerTotal += (partnerData.std14s || 0) * 10;
          partnerTotal += (partnerData.black14 || 0) * 20;
          partnerTotal += (partnerData.piratesCaptured || 0) * 30;
          partnerTotal += (partnerData.mermaidsCaptured || 0) * 20;
          partnerTotal += (partnerData.skByMermaid || 0) * 40;
          partnerTotal += 20; // Partner Alliance +20
          partnerTotal += partnerData.rascalBet || 0;

          if (partnerData.exp8) partnerTotal += 5;
          if (partnerData.exp7) partnerTotal -= 5;
          if (partnerData.firstMate) partnerTotal += 30;
          partnerTotal += (partnerData.seaMonsters || 0) * 20;

          partnerBonusInput.value = partnerTotal;
          partnerBonusInput.bonusData = partnerData;

          partnerBonusInput.dispatchEvent(
            new Event("input", { bubbles: true }),
          );
        }
      }

      // Trigger score recalculation
      activeBonusInputTarget.dispatchEvent(
        new Event("input", { bubbles: true }),
      );
    }
    closeBonusModal();
  });
}

// Make openBonusModal accessible globally
window.openBonusModal = openBonusModal;
