// ==========================================
// SCORING ENGINE
// ==========================================
function attachRealtimeCalculations() {
  const cards = document.querySelectorAll(".player-round-card");
  const cardsDealt = getCardsDealt();

  cards.forEach((card) => {
    const playerIndex = parseInt(card.dataset.playerIndex);
    const isGhost = players[playerIndex] && players[playerIndex].isGhost;

    const bidInput = card.querySelector(".bids");
    const wonInput = card.querySelector(".won");
    const bonusInput = card.querySelector(".bonus");

    const updateCardScores = () => {
      if (!isGhost && bidInput && parseInt(bidInput.value) > cardsDealt) {
        alert(
          `Your bid cannot be higher than the number of cards dealt (${cardsDealt})!`,
        );
        bidInput.value = cardsDealt;
      }

      // Re-evaluate scores for all players
      document
        .querySelectorAll(".player-round-card")
        .forEach((c) => calculatePlayerScore(c));
      validateTotalWonTricks();
    };

    if (bidInput) bidInput.addEventListener("input", updateCardScores);
    if (wonInput) wonInput.addEventListener("input", updateCardScores);

    if (bonusInput) {
      bonusInput.addEventListener("input", updateCardScores);
      bonusInput.addEventListener("click", () => {
        // Prevent opening the modal if it's Greybeard's Ghost
        if (isGhost) return;

        if (typeof openBonusModal === "function") {
          openBonusModal(bonusInput, bonusInput.bonusData || null);
        }
      });
    }
  });
}



function calculatePlayerScore(card) {
  const playerIndex = parseInt(card.dataset.playerIndex);
  if (players[playerIndex] && players[playerIndex].isGhost) {
    return; // Ghost accumulates no points
  }

  const bidInput = card.querySelector(".bids");
  const wonInput = card.querySelector(".won");
  const pointsInput = card.querySelector(".points");
  const bonusInput = card.querySelector(".bonus");
  const totalInput = card.querySelector(".total");

  if (!bidInput || !wonInput || bidInput.value === "" || wonInput.value === "") {
    if (pointsInput) pointsInput.value = "";
    if (totalInput) totalInput.value = "";
    return;
  }

  const bid = parseInt(bidInput.value) || 0;
  const won = parseInt(wonInput.value) || 0;
  let bonus = parseInt(bonusInput.value) || 0;
  const cardsDealt = getCardsDealt();

  // Handle Alliance Card scoring requirement: Bonus only applies if BOTH players met their bid
  const bonusData = bonusInput.bonusData;
  if (
    bonusData &&
    bonusData.allianceActive &&
    bonusData.alliancePartnerIndex !== null
  ) {
    const partnerCard = document.querySelector(
      `.player-round-card[data-player-index="${bonusData.alliancePartnerIndex}"]`,
    );

    let partnerMetBid = false;
    if (partnerCard) {
      const partnerBidVal = partnerCard.querySelector(".bids").value;
      const partnerWonVal = partnerCard.querySelector(".won").value;
      if (partnerBidVal !== "" && partnerWonVal !== "") {
        partnerMetBid = parseInt(partnerBidVal) === parseInt(partnerWonVal);
      }
    }

    const currentMetBid = bid === won;

    // If both players did NOT hit their bid, remove the +20 alliance points from this player's eligible bonus
    if (!(currentMetBid && partnerMetBid)) {
      bonus -= 20;
      if (bonus < 0) bonus = 0;
    }
  }

  let roundPoints = 0;
  let totalBonus = 0;

  const isRascelMode = rascelToggle && rascelToggle.checked;
  const isGrimesMode = grimesToggle && grimesToggle.checked;

  if (isGrimesMode) {
    roundPoints = bid === won ? 0 : 1;
    totalBonus = 0;
  } else if (isRascelMode) {
    const potentialPoints = cardsDealt * 10;
    const diff = Math.abs(bid - won);

    if (diff === 0) {
      roundPoints = potentialPoints;
      totalBonus = bonus;
    } else if (diff === 1) {
      roundPoints = potentialPoints / 2;
      totalBonus = bonus / 2;
    } else {
      roundPoints = 0;
      totalBonus = 0;
    }
  } else {
    if (bid === 0) {
      if (won === 0) {
        roundPoints = cardsDealt * 10;
      } else {
        roundPoints = -(cardsDealt * 10);
      }
    } else {
      if (bid === won) {
        roundPoints = bid * 20;
      } else {
        const difference = Math.abs(bid - won);
        roundPoints = -(difference * 10);
      }
    }
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
