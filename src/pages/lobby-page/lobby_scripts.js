const roomCode = document.getElementById("room-code-button");

function copyRoomCode() {
    

    // Check if the button currently displays the room code
    if (!roomCode.classList.contains("copied")) {
        const roomCodeText = roomCode.innerText;

        navigator.clipboard.writeText(roomCodeText).then(() => {
            roomCode.innerHTML = "<span class='copied-room-code'>Copied to clipboard!</span>";
            roomCode.classList.add("copied"); // Add the copied state

            setTimeout(() => {
                roomCode.innerHTML = roomCodeText; // Reset the button text to the original room code
                roomCode.classList.remove("copied"); // Remove the copied state
            }, 1200); // Reset text after 1.2 seconds
        }).catch(err => {
            console.error("Failed to copy room code: ", err);
        });
    }
}

const roomData = sessionStorage.getItem("initialRoomData");
if (roomData) {
    const parsedRoomData = JSON.parse(roomData);
    const playerDataList = JSON.parse(parsedRoomData.data.players);
    updatePlayerList(playerDataList);
    sessionStorage.removeItem("initialRoomData");
}


socket.onmessage = (event) => {

  const data = JSON.parse(event.data);
  if(data.type === "update_room") {
    const playerDataList = JSON.parse(data.data.players);
    
    updatePlayerList(playerDataList);
  }
};


function updatePlayerList(playerDataList){
    const playerList = document.getElementById("players-list");
    playerList.innerHTML = ""; // Clear the existing list

    playerDataList.forEach(player => {
        playerList.innerHTML += `<div class="player-slot">
                        <h1 class="player-name">${player.username}</h1>   
                        <img src="${player.skinPath}" class="player-icon">
                    </div>`;
    });
}

const hash = window.location.hash.substring(1); // remove '#'
const [route, queryString] = hash.split('?');  // split at '?'

const hashParams = new URLSearchParams(queryString);
const id = hashParams.get('id');

roomCode.innerText = id;