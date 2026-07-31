// ==========================================
// ELEMENT SELECTORS & UI LOGIC
// ==========================================
const gameModeScreen = document.getElementById("game-mode");
const setupScreen = document.getElementById("setup-screen");
const roundsScreen = document.getElementById("rounds");

const modeButtons = document.querySelectorAll("#mode-select button");
const input = document.getElementById("rowCount");
const tbody = document.querySelector("#dynamicTable tbody");
const startGameBtn = document.getElementById("start-btn");
const playersContainer = document.getElementById("players-container");
const submitRoundBtn = document.getElementById("submit-round-btn");

const rascelToggle = document.querySelector(
  "#rascel-scoring input[type='checkbox']",
);
const grimesToggle = document.querySelector(
  "#grimes-family input[type='checkbox']",
);

function switchScreen(targetScreenId) {
  if (gameModeScreen) gameModeScreen.classList.add("hidden");
  if (setupScreen) setupScreen.classList.add("hidden");
  if (roundsScreen) roundsScreen.classList.add("hidden");

  const targetScreen = document.getElementById(targetScreenId);
  if (targetScreen) {
    targetScreen.classList.remove("hidden");
    currentScreen = targetScreenId;
    saveGameState();
  }
}

function updateTableRows() {
  if (!tbody || !input) return;

  // Read current input value; default to 2 if empty or invalid
  let rawValue = parseInt(input.value);
  if (isNaN(rawValue)) return; // Allow user to backspace/type without instant overwrite

  // Clamp player count strictly between 2 and 8 for rendering
  let targetCount = Math.min(Math.max(rawValue, 2), 8);

  const currentCount = tbody.children.length;

  if (targetCount > currentCount) {
    for (let i = currentCount + 1; i <= targetCount; i++) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i}</td>
        <td class="player" contenteditable="true">Set player's name</td>
      `;
      tbody.appendChild(tr);
    }
  } else if (targetCount < currentCount) {
    for (let i = currentCount; i > targetCount; i--) {
      tbody.removeChild(tbody.lastChild);
    }
  }
}

// Clamp the input field value to 2-8 once focus leaves or user presses Enter
if (input) {
  input.addEventListener("change", () => {
    let val = parseInt(input.value) || 2;
    if (val < 2) val = 2;
    if (val > 8) val = 8;
    input.value = val;
    updateTableRows();
  });
}

function ensureHeaderControls() {
  const roundHeader = document.querySelector("#rounds header");
  if (!roundHeader) return;

  // Locate or create the subtitle element for cards dealt
  let cardsSubtitle = document.getElementById("cards-dealt-subtitle");
  if (!cardsSubtitle) {
    cardsSubtitle = document.createElement("div");
    cardsSubtitle.id = "cards-dealt-subtitle";
    cardsSubtitle.className = "cards-dealt-subtitle";
    // Insert immediately after the round title heading
    const roundTitle = document.getElementById("round-title-heading");
    if (roundTitle && roundTitle.parentNode) {
      roundTitle.parentNode.insertBefore(cardsSubtitle, roundTitle.nextSibling);
    } else {
      roundHeader.appendChild(cardsSubtitle);
    }
  }

  const sequence = getRoundSequence(selectedGameMode);
  const roundTitle = document.getElementById("round-title-heading");
  const cardsCount = getCardsDealt();

  if (roundTitle) {
    roundTitle.textContent = `Round ${currentRoundIndex + 1} of ${sequence.length}`;
  }

  if (cardsSubtitle) {
    cardsSubtitle.textContent = `(${cardsCount} ${cardsCount === 1 ? "Card" : "Cards"})`;
  }
}

function renderRoundPlayers() {
  if (!playersContainer) return;
  playersContainer.innerHTML = "";

  ensureHeaderControls();

  const cardsDealt = getCardsDealt();
  const isGrimesMode = grimesToggle && grimesToggle.checked;

  players.forEach((player, index) => {
    const playerBlock = document.createElement("div");
    playerBlock.className = "player-round-card";
    playerBlock.dataset.playerIndex = index;

    if (player.isGhost) {
      playerBlock.innerHTML = `
        <div class="player-info">
          <label class="player-name">${player.name}</label>
          <label class="place">-</label>
          <label class="total-points">-</label>
        </div>
        <div class="player-points ${isGrimesMode ? "grimes-mode" : ""}">
          <input type="text" class="bids ghost-input" value="-" readonly tabindex="-1" />
          <input type="number" class="won" placeholder="Won" min="0" max="${cardsDealt}" />
          <input type="text" class="points ghost-input" value="-" readonly tabindex="-1" />
          <input type="text" class="bonus ghost-input" value="-" readonly tabindex="-1" ${isGrimesMode ? 'style="display:none;"' : ""} />
          <input type="text" class="total ghost-input" value="-" readonly tabindex="-1" />
        </div>
      `;
    } else {
      playerBlock.innerHTML = `
        <div class="player-info">
          <label class="player-name">${player.name}</label>
          <label class="place">${getOrdinal(player.place || 1)}</label>
          <label class="total-points">${player.score} Pts.</label>
        </div>
        <div class="player-points ${isGrimesMode ? "grimes-mode" : ""}">
          <input type="number" class="bids" placeholder="Bid" min="0" max="${cardsDealt}" />
          <input type="number" class="won" placeholder="Won" min="0" max="${cardsDealt}" />
          <input type="number" class="points" placeholder="Points" readonly />
          <input type="number" class="bonus" placeholder="Bonus" readonly ${isGrimesMode ? 'style="display:none;"' : ""} />
          <input type="number" class="total" placeholder="Total" readonly />
        </div>
      `;
    }

    playersContainer.appendChild(playerBlock);
  });

  if (typeof attachRealtimeCalculations === "function") {
    attachRealtimeCalculations();
  }
}
