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

  let targetCount = parseInt(input.value) || 2;
  if (targetCount < 2) targetCount = 2;
  if (targetCount > 8) targetCount = 8;
  input.value = targetCount;

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

function ensureHeaderControls() {
  const roundHeader = document.querySelector("#rounds header");
  if (!roundHeader) return;

  let roundTitle = roundHeader.querySelector("#round-title-heading");
  if (!roundTitle) {
    roundTitle = document.createElement("h2");
    roundTitle.id = "round-title-heading";
    roundHeader.prepend(roundTitle);
  }

  const sequence = getRoundSequence(selectedGameMode);
  roundTitle.textContent = `Round ${currentRoundIndex + 1} of ${sequence.length} (${getCardsDealt()} Cards)`;

  let controlsDiv = roundHeader.querySelector(".header-controls");
  if (!controlsDiv) {
    controlsDiv = document.createElement("div");
    controlsDiv.className = "header-controls";
    roundHeader.appendChild(controlsDiv);
  }

  let prevBtn = document.getElementById("prev-round-btn");
  if (!prevBtn) {
    prevBtn = document.createElement("button");
    prevBtn.id = "prev-round-btn";
    prevBtn.className = "btn prev-round-btn";
    prevBtn.textContent = "Previous Round";
    controlsDiv.appendChild(prevBtn);
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
