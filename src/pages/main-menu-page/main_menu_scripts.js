// DOM elements
const roomCodeField = document.getElementById("room-code-textfield");
const createRoomButton = document.getElementById("create-room-button");

// Retrieve session data
const username = sessionStorage.getItem('username');
const skin = sessionStorage.getItem('skin');

// Event listener for creating a room
createRoomButton.addEventListener("click", createRoom);


async function startMatchmaking(){
    const request = startMatchmakingRequest();

    if (!sendToServer(request)) return; // Ensure the request was sent successfully

    const response = await getMessageFromServer();
    console.log("Join room response:", response);

    switch (response.type) {
        case "update_room":
            //  Successfully joined room
            handleRoomUpdate(response);
            break;
        case "start_matchmaking_failed":
            // Failed to join
            showCustomAlert("Looks like all rooms are unavailable right now! Try again in a moment — or pick a new nickname if someone’s already using yours.");
            break;
        default:
            // Unexpected response
            console.warn("Unexpected response:", response);
    }
}


/**
 * Called when a player attempts to join a room.
 * Validates the room code length before proceeding.
 */
function joinRoom() {
    const code = roomCodeField.value.trim();
    if (code.length > 0 && code.length <= 15) {
        handleRoomJoin(code);
    }
    else{
        roomCodeField.classList.add("error");
        error_sound.currentTime = 0;
        error_sound.play();
        setTimeout(() => {
            roomCodeField.placeholder = "Enter Room Code...";
            roomCodeField.classList.remove("error");
            roomCodeField.disabled = false;
            roomCodeField.focus();
        }, 400);
    }
}

/**
 * Sends a join room request and handles the server response.
 * @param {string} roomCode - The code of the room to join.
 */
async function handleRoomJoin(roomCode) {
    const request = createJoinRoomRequest(roomCode);

    if (!sendToServer(request)) return; // Ensure the request was sent successfully

    const response = await getMessageFromServer();
    console.log("Join room response:", response);

    switch (response.type) {
        case "update_room":
            //  Successfully joined room
            handleRoomUpdate(response);
            break;
        case "join_room_failed":
            // Failed to join
            showCustomAlert("We couldn’t get you into that room! Double-check the code — or try a new nickname if someone’s already using yours.");
            break;
        default:
            // Unexpected response
            console.warn("Unexpected response:", response);
    }
}


function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    const messageElement = document.getElementById('alert-message');
    const closeButton = document.getElementById('close-alert');

    messageElement.textContent = message;
    alertBox.classList.remove('hidden');

    // Close alert on click
    closeButton.onclick = () => {
        alertBox.classList.add('hidden');
    };

    // Also close when clicking outside the box
    alertBox.onclick = (e) => {
        if (e.target === alertBox) {
            alertBox.classList.add('hidden');
        }
    };
}


/**
 * Sends a create room request and handles the server response.
 */
async function createRoom() {
    const request = createCreateRoomRequest();

    if (!sendToServer(request)) return;

    try {
        const response = await getMessageFromServer();
        console.log("Create room response:", response);

        if (response.type === "update_room") {
            // Room created successfully
            handleRoomUpdate(response);
        } else {
            // Failed to create room
            showCustomAlert("Hmm… something went wrong while creating your room. Try again!");
        }

        // Log WebSocket errors
        socket.addEventListener("error", (err) => {
            console.error("WebSocket error:", err);
        });
        sessionStorage.setItem("host","true");

    } catch (err) {
        console.error("Error:", err);
    }
}


function startMatchmakingRequest(){
    return {
        type: "start_matchmaking",
        data: {
            player: {
                name: username,
                skinPath: skin
            }
        }
    };
}


/**
 * Constructs the request object for joining a room.
 * @param {string} code - The room code to join.
 * @returns {object} - The request object.
 */
function createJoinRoomRequest(code) {
    sessionStorage.setItem("host","false")
    return {
        type: "join_room",
        data: {
            roomCode: code,
            player: {
                name: username,
                skinPath: skin
            }
        }
    };
}

/**
 * Constructs the request object for creating a new room.
 * @returns {object} - The request object.
 */
function createCreateRoomRequest() {
    return {
        type: "create_room",
        data: {
            player: {
                name: username,
                skinPath: skin
            }
        }
    };
}

/**
 * Handles room update responses by saving data and redirecting to lobby.
 * @param {object} response - The response from the server.
 */
function handleRoomUpdate(response) {
    sessionStorage.setItem("host","false");
    sessionStorage.setItem("initialRoomData", JSON.stringify(response));
    const roomCode = response.data.roomCode;
    document.location.hash = `#lobby?id=${roomCode}`;
}

/**
 * Sends data to the server via WebSocket.
 * @param {object} data - The data to send.
 * @returns {boolean} - True if sent successfully.
 */
function sendToServer(data) {
    try {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
            return true;
        }
    } catch (e) {
        console.error(e);
    }
    return false;
}
