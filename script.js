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

// Toggle selectors for scoring variations
const rascelToggle = document.querySelector(
  "#rascel-scoring input[type='checkbox']",
);
const grimesToggle = document.querySelector(
  "#grimes-family input[type='checkbox']",
);

let selectedGameMode = "Normal";
let players = [];
let currentScreen = "game-mode";
let currentRoundIndex = 0; // 0-based index for step progression

// Helper function to format places (1st, 2nd, 3rd, etc.)
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Helper to determine the sequence of card hand sizes based on the mode
function getRoundSequence(mode) {
  switch (mode) {
    case "Even Keeled":
      return [2, 4, 6, 8, 10];
    case "Skip to the Brawl":
      return [6, 7, 8, 9, 10];
    case "Swift-n-Salty Skirmish":
      return [5, 5, 5, 5, 5];
    case "Broadside Barrage":
      return [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    case "Whirlpool":
      return [9, 7, 5, 3, 1, 9, 7, 5, 3, 1];
    case "Past Your Bedtime":
      return [1];
    case "Normal":
    default:
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
}

// Get the current hand size (cards dealt)
function getCardsDealt() {
  const sequence = getRoundSequence(selectedGameMode);
  return sequence[currentRoundIndex] || sequence[sequence.length - 1];
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
    currentRoundIndex: currentRoundIndex,
    rascelScoringEnabled: rascelToggle ? rascelToggle.checked : false,
    grimesScoringEnabled: grimesToggle ? grimesToggle.checked : false,
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
  currentRoundIndex = gameState.currentRoundIndex || 0;

  if (rascelToggle && gameState.rascelScoringEnabled !== undefined) {
    rascelToggle.checked = gameState.rascelScoringEnabled;
  }
  if (grimesToggle && gameState.grimesScoringEnabled !== undefined) {
    grimesToggle.checked = gameState.grimesScoringEnabled;
  }

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

// Listen for toggle changes to persist state
if (rascelToggle) {
  rascelToggle.addEventListener("change", saveGameState);
}
if (grimesToggle) {
  grimesToggle.addEventListener("change", saveGameState);
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

  currentRoundIndex = 0; // Reset to the first round in the sequence

  renderRoundPlayers();
  switchScreen("rounds");
}

function renderRoundPlayers() {
  playersContainer.innerHTML = "";

  const cardsDealt = getCardsDealt();
  const sequence = getRoundSequence(selectedGameMode);
  const totalRounds = sequence.length;
  const isGrimesMode = grimesToggle && grimesToggle.checked;

  const roundTitle = document.getElementById("round-title");
  if (roundTitle) {
    const cardText = cardsDealt === 1 ? "1 Card" : `${cardsDealt} Cards`;
    roundTitle.innerHTML = `
      Round ${currentRoundIndex + 1} of ${totalRounds}
      <span class="card-count-subtitle">${cardText}</span>
    `;
  }

  players.forEach((player, index) => {
    const playerBlock = document.createElement("div");
    playerBlock.classList.add("player-round-card");
    playerBlock.dataset.playerIndex = index;

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
        <input type="number" class="bonus" placeholder="Bonus" min="0" ${isGrimesMode ? 'style="display:none;"' : ""} />
        <input type="number" class="total" placeholder="Total" readonly />
      </div>
    `;

    playersContainer.appendChild(playerBlock);
  });

  attachRealtimeCalculations();
}

function attachRealtimeCalculations() {
  const cards = document.querySelectorAll(".player-round-card");
  const cardsDealt = getCardsDealt();

  cards.forEach((card) => {
    const bidInput = card.querySelector(".bids");
    const wonInput = card.querySelector(".won");
    const bonusInput = card.querySelector(".bonus");

    const updateCardScores = () => {
      // Validate that bid does not exceed available cards
      if (parseInt(bidInput.value) > cardsDealt) {
        alert(
          `Your bid cannot be higher than the number of cards dealt (${cardsDealt})!`,
        );
        bidInput.value = cardsDealt;
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
  const cardsDealt = getCardsDealt();

  let roundPoints = 0;
  let totalBonus = 0;

  const isRascelMode = rascelToggle && rascelToggle.checked;
  const isGrimesMode = grimesToggle && grimesToggle.checked;

  if (isGrimesMode) {
    // ==========================================
    // GRIMES FAMILY SCORING
    // ==========================================
    // Hit bid: 0 points. Miss bid: 1 point. No bonus points.
    roundPoints = bid === won ? 0 : 1;
    totalBonus = 0;
  } else if (isRascelMode) {
    // ==========================================
    // RASCEL OF ROATAN (EVEN KEELED) SCORING
    // ==========================================
    const potentialPoints = cardsDealt * 10;
    const diff = Math.abs(bid - won);

    if (diff === 0) {
      // Direct Hit
      roundPoints = potentialPoints;
      totalBonus = bonus;
    } else if (diff === 1) {
      // Glancing Blow
      roundPoints = potentialPoints / 2;
      totalBonus = bonus / 2;
    } else {
      // Complete Miss (diff >= 2)
      roundPoints = 0;
      totalBonus = 0;
    }
  } else {
    // ==========================================
    // STANDARD SCORING
    // ==========================================
    if (bid === 0) {
      // Zero Bid Rule
      if (won === 0) {
        roundPoints = cardsDealt * 10;
      } else {
        roundPoints = -(cardsDealt * 10);
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

    // Standard Bonus Points are awarded only on an exact hit
    totalBonus = bid === won ? bonus : 0;
  }

  const roundTotal = roundPoints + totalBonus;

  pointsInput.value = roundPoints;
  totalInput.value = roundTotal;
}

function validateTotalWonTricks() {
  const wonInputs = document.querySelectorAll(".player-points .won");
  const cardsDealt = getCardsDealt();
  let totalWonSoFar = 0;

  wonInputs.forEach((i) => {
    totalWonSoFar += parseInt(i.value) || 0;
  });

  if (totalWonSoFar > cardsDealt) {
    alert(`Total tricks won in this round cannot exceed ${cardsDealt}!`);
  }
}

// Submit Round Action
if (submitRoundBtn) {
  submitRoundBtn.addEventListener("click", () => {
    const cards = document.querySelectorAll(".player-round-card");
    const cardsDealt = getCardsDealt();
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
        if (individualBid > cardsDealt) {
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
      alert(`No single player's bid can be higher than ${cardsDealt}.`);
      return;
    }

    if (totalWon > cardsDealt) {
      alert(
        `Invalid score! Total won tricks (${totalWon}) exceeds available tricks (${cardsDealt}).`,
      );
      return;
    }

    // Add round results to player scores
    cards.forEach((card) => {
      const playerIndex = parseInt(card.dataset.playerIndex);
      const roundTotal = parseInt(card.querySelector(".total").value) || 0;
      players[playerIndex].score += roundTotal;
    });

    // Calculate ranking positions dynamically
    const isGrimesMode = grimesToggle && grimesToggle.checked;
    const sortedScores = [...players]
      .map((p) => p.score)
      .sort((a, b) => (isGrimesMode ? a - b : b - a)); // Lowest points win for Grimes mode

    players.forEach((player) => {
      player.place = sortedScores.indexOf(player.score) + 1;
    });

    // Advance to the next round in sequence
    const sequence = getRoundSequence(selectedGameMode);
    currentRoundIndex++;

    if (currentRoundIndex >= sequence.length) {
      // Determine winner based on active ruleset
      const winner = [...players].sort((a, b) =>
        isGrimesMode ? a.score - b.score : b.score - a.score,
      )[0];

      let msg = `Game Over!\n\nWinner: ${winner.name} with ${winner.score} points!`;
      if (selectedGameMode === "Past Your Bedtime") {
        msg += "\n\n...Now go get a goodnight hug! 🤗";
      }
      alert(msg);
      switchScreen("game-mode");
      return;
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
