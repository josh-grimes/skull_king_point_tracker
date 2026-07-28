// ==========================================
// 1. ELEMENT SELECTORS & GAME STATE
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

let selectedGameMode = "Normal";
let players = [];
let currentScreen = "game-mode";
let currentRound = 1;

// Helper function to format places (1st, 2nd, 3rd, etc.)
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ==========================================
// 2. SCREEN NAVIGATION & LOCAL STORAGE
// ==========================================
function switchScreen(targetScreenId) {
  gameModeScreen.classList.add("hidden");
  setupScreen.classList.add("hidden");
  roundsScreen.classList.add("hidden");

  const targetScreen = document.getElementById(targetScreenId);
  if (targetScreen) {
    targetScreen.classList.remove("hidden");
    currentScreen = targetScreenId;
    saveGameState();
  }
}

function saveGameState() {
  const gameState = {
    currentScreen: currentScreen,
    selectedGameMode: selectedGameMode,
    players: players,
    playerCount: input.value,
    currentRound: currentRound,
  };
  localStorage.setItem("skullKingState", JSON.stringify(gameState));
}

function loadGameState() {
  const savedData = localStorage.getItem("skullKingState");
  if (!savedData) return;

  const gameState = JSON.parse(savedData);
  currentScreen = gameState.currentScreen || "game-mode";
  selectedGameMode = gameState.selectedGameMode || "Normal";
  players = gameState.players || [];
  currentRound = gameState.currentRound || 1;

  if (gameState.playerCount) {
    input.value = gameState.playerCount;
  }

  if (currentScreen === "rounds" && players.length > 0) {
    renderRoundPlayers();
    switchScreen("rounds");
  } else if (currentScreen === "setup-screen") {
    updateTableRows();
    switchScreen("setup-screen");
  } else {
    switchScreen("game-mode");
  }
}

// ==========================================
// 3. STEP 1: GAME MODE SELECTION
// ==========================================
function goToSetup(event) {
  selectedGameMode = event.target.textContent.trim();
  switchScreen("setup-screen");
}

modeButtons.forEach((button) => {
  button.addEventListener("click", goToSetup);
});

// ==========================================
// 4. STEP 2: PLAYER SETUP TABLE
// ==========================================
function updateTableRows() {
  let targetCount = parseInt(input.value) || 0;
  if (targetCount < 2) targetCount = 2;
  if (targetCount > 8) targetCount = 8;

  const currentCount = tbody.children.length;

  if (targetCount > currentCount) {
    for (let i = currentCount + 1; i <= targetCount; i++) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="num">${i}</td>
        <td class="player" contenteditable="true">Set player's name</td>
      `;
      tbody.appendChild(row);
    }
  } else if (targetCount < currentCount) {
    for (let i = currentCount; i > targetCount; i--) {
      tbody.lastElementChild.remove();
    }
  }
  saveGameState();
}

input.addEventListener("input", updateTableRows);

// Clear or restore default placeholders on focus
tbody.addEventListener("focusin", (event) => {
  if (event.target.classList.contains("player")) {
    if (event.target.textContent.trim() === "Set player's name") {
      event.target.textContent = "";
    }
  }
});

tbody.addEventListener("focusout", (event) => {
  if (event.target.classList.contains("player")) {
    if (event.target.textContent.trim() === "") {
      event.target.textContent = "Set player's name";
    }
  }
});

// ==========================================
// 5. STEP 3: GAMEPLAY & SCORING
// ==========================================
function handleStartGame() {
  players = [];
  const playerCells = document.querySelectorAll("#dynamicTable .player");

  playerCells.forEach((cell, index) => {
    let name = cell.textContent.trim();
    if (name === "" || name === "Set player's name") {
      name = `Player ${index + 1}`;
    }

    players.push({
      id: index + 1,
      name: name,
      score: 0,
      place: 1, // Default rank before scores are submitted
    });
  });

  // Set the starting round based on game mode
  if (selectedGameMode === "Even Only") {
    currentRound = 2;
  } else {
    currentRound = 1; // Normal or Odd Only mode
  }

  renderRoundPlayers();
  switchScreen("rounds");
}

function renderRoundPlayers() {
  playersContainer.innerHTML = "";

  const roundTitle = document.getElementById("round-title");
  if (roundTitle) {
    roundTitle.textContent = `Round ${currentRound}`;
  }

  players.forEach((player, index) => {
    const playerBlock = document.createElement("div");
    playerBlock.classList.add("player-round-card");
    playerBlock.dataset.playerIndex = index;

    // Display position place using player.place instead of array index
    playerBlock.innerHTML = `
      <div class="player-info">
        <label class="player-name">${player.name}</label>
        <label class="place">${getOrdinal(player.place || 1)}</label>
        <label class="total-points">${player.score} Pts.</label>
      </div>
      <div class="player-points">
        <input type="number" class="bids" placeholder="Bid" min="0" max="${currentRound}" />
        <input type="number" class="won" placeholder="Won" min="0" max="${currentRound}" />
        <input type="number" class="points" placeholder="Points" readonly />
        <input type="number" class="bonus" placeholder="Bonus" min="0" />
        <input type="number" class="total" placeholder="Total" readonly />
      </div>
    `;

    playersContainer.appendChild(playerBlock);
  });

  attachRealtimeCalculations();
}

function attachRealtimeCalculations() {
  const cards = document.querySelectorAll(".player-round-card");

  cards.forEach((card) => {
    const bidInput = card.querySelector(".bids");
    const wonInput = card.querySelector(".won");
    const bonusInput = card.querySelector(".bonus");

    const updateCardScores = () => {
      // Validate that this specific player's bid does not exceed currentRound
      if (parseInt(bidInput.value) > currentRound) {
        alert(
          `Your bid cannot be higher than the round number (${currentRound})!`,
        );
        bidInput.value = currentRound;
      }

      calculatePlayerScore(card);
      validateTotalWonTricks();
    };

    bidInput.addEventListener("input", updateCardScores);
    wonInput.addEventListener("input", updateCardScores);
    bonusInput.addEventListener("input", updateCardScores);
  });
}

function calculatePlayerScore(card) {
  const bidInput = card.querySelector(".bids");
  const wonInput = card.querySelector(".won");
  const pointsInput = card.querySelector(".points");
  const bonusInput = card.querySelector(".bonus");
  const totalInput = card.querySelector(".total");

  if (bidInput.value === "" || wonInput.value === "") {
    pointsInput.value = "";
    totalInput.value = "";
    return;
  }

  const bid = parseInt(bidInput.value) || 0;
  const won = parseInt(wonInput.value) || 0;
  const bonus = parseInt(bonusInput.value) || 0;

  let roundPoints = 0;

  if (bid === 0) {
    // Zero Bid Rule
    if (won === 0) {
      roundPoints = currentRound * 10;
    } else {
      roundPoints = -(currentRound * 10);
    }
  } else {
    // Non-Zero Bid Rule
    if (bid === won) {
      roundPoints = bid * 20;
    } else {
      const difference = Math.abs(bid - won);
      roundPoints = -(difference * 10);
    }
  }

  // Bonus points are awarded only if the bid was exact
  const totalBonus = bid === won ? bonus : 0;
  const roundTotal = roundPoints + totalBonus;

  pointsInput.value = roundPoints;
  totalInput.value = roundTotal;
}

function validateTotalWonTricks() {
  const wonInputs = document.querySelectorAll(".player-points .won");
  let totalWonSoFar = 0;

  wonInputs.forEach((i) => {
    totalWonSoFar += parseInt(i.value) || 0;
  });

  if (totalWonSoFar > currentRound) {
    alert(
      `Total tricks won in Round ${currentRound} cannot exceed ${currentRound}!`,
    );
  }
}

// Submit Round Action
if (submitRoundBtn) {
  submitRoundBtn.addEventListener("click", () => {
    const cards = document.querySelectorAll(".player-round-card");
    let allValid = true;
    let totalWon = 0;
    let invalidBidFound = false;

    cards.forEach((card) => {
      const bidVal = card.querySelector(".bids").value;
      const wonVal = card.querySelector(".won").value;

      if (bidVal === "" || wonVal === "") {
        allValid = false;
      } else {
        const individualBid = parseInt(bidVal) || 0;
        if (individualBid > currentRound) {
          invalidBidFound = true;
        }
        totalWon += parseInt(wonVal) || 0;
      }
    });

    if (!allValid) {
      alert("Please enter both Bid and Won values for all players.");
      return;
    }

    if (invalidBidFound) {
      alert(`No single player's bid can be higher than ${currentRound}.`);
      return;
    }

    if (totalWon > currentRound) {
      alert(
        `Invalid score! Total won tricks (${totalWon}) exceeds available tricks (${currentRound}) for Round ${currentRound}.`,
      );
      return;
    }

    // Add round results to player scores without reordering the original array
    cards.forEach((card) => {
      const playerIndex = parseInt(card.dataset.playerIndex);
      const roundTotal = parseInt(card.querySelector(".total").value) || 0;
      players[playerIndex].score += roundTotal;
    });

    // Calculate ranking positions dynamically
    const sortedScores = [...players].map((p) => p.score).sort((a, b) => b - a);

    players.forEach((player) => {
      player.place = sortedScores.indexOf(player.score) + 1;
    });

    // Advance to next round based on selected game mode
    if (selectedGameMode === "Odd Only" || selectedGameMode === "Even Only") {
      currentRound += 2;
    } else {
      currentRound += 1;
    }

    renderRoundPlayers();
    saveGameState();
  });
}

startGameBtn.addEventListener("click", handleStartGame);

// ==========================================
// 6. INITIALIZE APP
// ==========================================
updateTableRows();
loadGameState();
