// ==========================================
// MAIN INITIALIZATION & CONTROLLERS
// ==========================================

if (rascelToggle) {
  rascelToggle.addEventListener("change", saveGameState);
}
if (grimesToggle) {
  grimesToggle.addEventListener("change", saveGameState);
}

function goToSetup(event) {
  const btn = event.currentTarget;
  const topSpan = btn.querySelector(".top-line");
  selectedGameMode = topSpan
    ? topSpan.textContent.trim()
    : btn.textContent.trim();

  updateTableRows();
  switchScreen("setup-screen");
}

modeButtons.forEach((button) => {
  button.addEventListener("click", goToSetup);
});

// Back to Main Menu functionality
const backMenuButtons = document.querySelectorAll(".back-menu-btn");
backMenuButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchScreen("game-mode");
  });
});

if (input) {
  input.addEventListener("input", updateTableRows);
}

if (tbody) {
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
}

function handleStartGame() {
  players = [];
  roundScores = [];
  const playerCells = document.querySelectorAll("#dynamicTable .player");

  playerCells.forEach((cell, index) => {
    let name = cell.textContent.trim();
    if (name === "" || name === "Set player's name") {
      name = `Player ${index + 1}`;
    }

    players.push({
      name: name,
      score: 0,
      place: 1,
      isGhost: false,
    });
  });

  // Automatically add Greybeard's Ghost for 2-player games
  if (players.length === 2) {
    players.push({
      name: "Greybeard's Ghost",
      score: 0,
      place: 1,
      isGhost: true,
    });
  }

  currentRoundIndex = 0;
  renderRoundPlayers();
  switchScreen("rounds");
}

if (startGameBtn) {
  startGameBtn.addEventListener("click", handleStartGame);
}

if (submitRoundBtn) {
  submitRoundBtn.addEventListener("click", () => {
    const cards = document.querySelectorAll(".player-round-card");
    const cardsDealt = getCardsDealt();

    let missingBidFound = false;
    let invalidBidFound = false;
    let totalWon = 0;

    cards.forEach((card) => {
      const playerIndex = parseInt(card.dataset.playerIndex);
      const isGhost = players[playerIndex] && players[playerIndex].isGhost;

      const bidVal = card.querySelector(".bids").value;
      const wonVal = card.querySelector(".won").value;

      if (!isGhost && bidVal === "") {
        missingBidFound = true;
      }

      if (!isGhost && parseInt(bidVal) > cardsDealt) {
        invalidBidFound = true;
      }

      totalWon += parseInt(wonVal) || 0;
    });

    if (missingBidFound) {
      alert("Please enter bids for all players.");
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

    const currentRoundTotals = [];
    cards.forEach((card) => {
      const playerIndex = parseInt(card.dataset.playerIndex);
      const roundTotal = parseInt(card.querySelector(".total").value) || 0;
      players[playerIndex].score += roundTotal;
      currentRoundTotals.push(roundTotal);
    });

    roundScores.push(currentRoundTotals);

    const isGrimesMode = grimesToggle && grimesToggle.checked;
    const sortedScores = [...players]
      .map((p) => p.score)
      .sort((a, b) => (isGrimesMode ? a - b : b - a));

    players.forEach((player) => {
      player.place = sortedScores.indexOf(player.score) + 1;
    });

    const sequence = getRoundSequence(selectedGameMode);
    currentRoundIndex++;

    if (currentRoundIndex >= sequence.length) {
      const winner = [...players].sort((a, b) =>
        isGrimesMode ? a.score - b.score : b.score - a.score,
      )[0];

      let msg = `Game Over!\n\nWinner: ${winner.name} with ${winner.score} points!`;
      if (selectedGameMode === "Past Your Bedtime") {
        msg += "\n\n...Now go get some sleep!";
      }
      alert(msg);
    } else {
      renderRoundPlayers();
      saveGameState();
    }
  });
}

// Global Event Delegation for Previous Round Button
document.addEventListener("click", (event) => {
  if (event.target && event.target.id === "prev-round-btn") {
    if (currentRoundIndex <= 0) {
      alert("You are already on the first round!");
      return;
    }

    currentRoundIndex--;

    const lastRoundPoints = roundScores.pop() || [];
    players.forEach((player, index) => {
      const pointsToRemove = lastRoundPoints[index] || 0;
      player.score -= pointsToRemove;
    });

    const isGrimesMode = grimesToggle && grimesToggle.checked;
    const sortedScores = [...players]
      .map((p) => p.score)
      .sort((a, b) => (isGrimesMode ? a - b : b - a));

    players.forEach((player) => {
      player.place = sortedScores.indexOf(player.score) + 1;
    });

    renderRoundPlayers();
    saveGameState();
  }
});

document.addEventListener("DOMContentLoaded", loadGameState);
