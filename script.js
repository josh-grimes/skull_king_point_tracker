const input = document.getElementById("rowCount");
const tbody = document.querySelector("#dynamicTable tbody");

function updateTableRows() {
  // Ensure the count stays within reasonable boundaries
  let targetCount = parseInt(input.value) || 0;
  if (targetCount < 2) targetCount = 2;
  if (targetCount > 8) targetCount = 8;

  const currentCount = tbody.children.length;

  if (targetCount > currentCount) {
    // Add only the missing rows (preserves existing input data)
    for (let i = currentCount + 1; i <= targetCount; i++) {
      const row = document.createElement("tr");
      row.innerHTML = `<td class="num">${i}</td>
            <td class="player" contenteditable="true">Set player's name</td>
          `;
      tbody.appendChild(row);
    }
  } else if (targetCount < currentCount) {
    // Remove extra rows from the bottom
    for (let i = currentCount; i > targetCount; i--) {
      tbody.lastElementChild.remove();
    }
  }
}

// Listen for typing/pasting OR clicking the number input up/down arrows
input.addEventListener("input", updateTableRows);

// Initial render based on the input's default value
updateTableRows();
