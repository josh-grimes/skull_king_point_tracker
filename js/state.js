// ==========================================
// GAME STATE & HELPERS
// ==========================================
let selectedGameMode = "Normal";
let players = [];
let roundScores = []; // Keeps track of added scores per round
let currentScreen = "game-mode";
let currentRoundIndex = 0;

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

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

function getCardsDealt() {
  const sequence = getRoundSequence(selectedGameMode);
  return sequence[currentRoundIndex] || sequence[sequence.length - 1];
}

function saveGameState() {
  const gameState = {
    currentScreen: currentScreen,
    selectedGameMode: selectedGameMode,
    players: players,
    roundScores: roundScores,
    playerCount: input ? input.value : 2,
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
  roundScores = gameState.roundScores || [];
  currentRoundIndex = gameState.currentRoundIndex || 0;

  if (rascelToggle && gameState.rascelScoringEnabled !== undefined) {
    rascelToggle.checked = gameState.rascelScoringEnabled;
  }
  if (grimesToggle && gameState.grimesScoringEnabled !== undefined) {
    grimesToggle.checked = gameState.grimesScoringEnabled;
  }

  if (input && gameState.playerCount) {
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
