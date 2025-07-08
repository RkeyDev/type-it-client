// DOM Elements
const roomCodeButton = document.getElementById("room-code-button");
const playerListContainer = document.getElementById("players-list");

// Extract room code from URL hash and display it
const hash = window.location.hash.substring(1);
const [route, queryString] = hash.split('?');
const hashParams = new URLSearchParams(queryString);
const roomId = hashParams.get('id');
roomCodeButton.innerText = roomId;

// Event listener for copying the room code to clipboard
roomCodeButton.addEventListener("click", copyRoomCode);

/**
 * Copies the displayed room code to the clipboard
 * and shows a confirmation message temporarily.
 */
function copyRoomCode() {
    if (roomCodeButton.classList.contains("copied")) return;

    const roomCodeText = roomCodeButton.innerText;

    // Copy the room code to clipboard, then update the button text
    navigator.clipboard.writeText(roomCodeText).then(() => {
        roomCodeButton.innerHTML = "<span class='copied-room-code'>Copied to clipboard!</span>";
        roomCodeButton.classList.add("copied");

        const delay = 1200; // milliseconds

        // Reset the button text after a short delay
        setTimeout(() => {
            roomCodeButton.innerText = roomCodeText;
            roomCodeButton.classList.remove("copied");
        }, delay);
    }).catch(err => {
        console.error("Failed to copy room code: ", err);
    });
}

/**
 * Updates the player list UI with the given player data.
 * @param {Array} playerDataList - List of player objects to render.
 */
function updatePlayerList(playerDataList) {
    playerListContainer.innerHTML = ""; // Clear existing entries

    playerDataList.forEach(player => {
        const playerSlot = document.createElement("div");
        playerSlot.className = "player-slot";

        const nameElement = document.createElement("h1");
        nameElement.className = "player-name";
        nameElement.textContent = player.username;

        const skinElement = document.createElement("img");
        skinElement.className = "player-icon";
        skinElement.src = player.skinPath;

        playerSlot.appendChild(nameElement);
        playerSlot.appendChild(skinElement);
        playerListContainer.appendChild(playerSlot);
    });
}

/**
 * Parses and loads initial room data from session storage (if available).
 */
function loadInitialRoomData() {
    const roomData = sessionStorage.getItem("initialRoomData");
    if (!roomData) return;

    try {
        const parsedRoomData = JSON.parse(roomData);
        const playerDataList = JSON.parse(parsedRoomData.data.players);
        updatePlayerList(playerDataList);
    } catch (err) {
        console.error("Failed to load room data from session:", err);
    }

    sessionStorage.removeItem("initialRoomData");
}

/**
 * Handles incoming socket messages and updates room accordingly.
 */
socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === "update_room") {
            const playerDataList = JSON.parse(data.data.players);
            updatePlayerList(playerDataList);
        }
    } catch (err) {
        console.error("Failed to handle incoming message:", err);
    }
};

// Run on page load
loadInitialRoomData();
