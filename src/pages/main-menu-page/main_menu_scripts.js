const room_code_textfield = document.getElementById("room-code-textfield");

// Get session storage data
const username = window.sessionStorage.getItem('username');
const skin = window.sessionStorage.getItem('skin');

document.getElementById("create-room-button").addEventListener("click", createRoom);

function joinRoom() {
    const codeLength = room_code_textfield.value.length;
    if (codeLength > 0 && codeLength <= 15) {
        handleRoomJoin();
    }
}

async function handleRoomJoin() {
    const room_code = room_code_textfield.value;

    const request = {
        type: "join_room",
        data: {
            roomCode: room_code,
            player: {
                name: username, 
                skinPath: skin
            }
        }
    };

    if (sendSessionStorageData(request)) {
        const response = await getMessageFromServer();
        console.log("Join room response:", response);

        if (response.type === "join_room_succeeded") {
            document.location.hash = `#lobby?id=${response.data.roomCode}`;
        } else if (response.type === "join_room_failed") {
            alert("Couldn't join room. Please check the room code and try again.");
        } else {
            console.warn("Unexpected response:", response);
        }
    }
}

async function createRoom() {
    try {
        const request = {
            type: "create_room",
            data: {
                player: {
                    name: username, 
                    skinPath: skin
                }
            }
        };

        if (sendSessionStorageData(request)) {
            const response = await getMessageFromServer();
            console.log("Create room response:", response);

            if (response.type === "create_room_succeed") {
                const room_code = response.data.roomCode;
                document.location.hash = `#lobby?id=${room_code}`;
            } else {
                alert("Failed to create room.");
            }
        }

        socket.addEventListener("error", (err) => {
            console.error("WebSocket error:", err);
        });

    } catch (err) {
        console.error("Error:", err);
    }
}

async function getRoomCode() {
    const request = {
        type: "get_room_code"
    };
    sendSessionStorageData(request);
    const data = await getMessageFromServer();
    if (data.type === "create_room_succeed") {
        try {
            return data.data.roomCode;
        } catch (e) {
            throw e;
        }
    }
    return null;
}

function sendSessionStorageData(data) {
    try {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
            return true;
        }
    } catch (e) {
        console.log(e);
    }
    return false;
}
