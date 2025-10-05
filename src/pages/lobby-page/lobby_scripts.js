(function(){
  let roomId = null;
  let roomCodeButton = null;
  let playerListContainer = null;
  let startButton = null;
  let form = null;

  function copyRoomCode(){
    if (!roomCodeButton) return;
    if (roomCodeButton.classList.contains("copied")) return;
    const roomCodeText = roomCodeButton.innerText || "";
    navigator.clipboard.writeText(roomCodeText).then(() => {
      roomCodeButton.innerHTML = "<span class='copied-room-code'>Copied to clipboard!</span>";
      roomCodeButton.classList.add("copied");
      setTimeout(() => {
        roomCodeButton.innerText = roomCodeText;
        roomCodeButton.classList.remove("copied");
      }, 1200);
    }).catch(err => console.error("Failed to copy room code:", err));
  }

  function updatePlayerList(playerDataList){
    if (!playerListContainer) return;
    playerListContainer.innerHTML = "";
    const playersList = [];
    (playerDataList || []).forEach(player => {
      playersList.push({
        username: player.username,
        skinPath: player.skinPath
      });
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
    sessionStorage.setItem("playersList", JSON.stringify(playersList));
  }

  function loadPlayersFromSessionOrInitialData() {
    const storedPlayers = sessionStorage.getItem("playersList");
    if (storedPlayers) {
      try {
        const playersList = JSON.parse(storedPlayers);
        updatePlayerList(playersList);
      } catch (err) {
        console.error("Failed to parse playersList from sessionStorage:", err);
      }
      return;
    }

    // fallback to initialRoomData
    const roomDataStr = sessionStorage.getItem("initialRoomData");
    if (!roomDataStr) return;

    try {
      const parsedRoomData = JSON.parse(roomDataStr);
      const playerDataList = typeof parsedRoomData.data.players === 'string'
        ? JSON.parse(parsedRoomData.data.players)
        : parsedRoomData.data.players;
      updatePlayerList(playerDataList);
      if (!roomId && parsedRoomData.data && parsedRoomData.data.roomCode)
        roomId = parsedRoomData.data.roomCode;
      if (roomCodeButton) roomCodeButton.innerText = roomId || roomCodeButton.innerText || "Error";
    } catch (err) {
      console.error("Failed to load room data from session:", err);
    }
    sessionStorage.removeItem("initialRoomData");
  }

  function onSocketMessage(event){
    try {
      const data = JSON.parse(event.data);
      if (data.type === "update_room") {
        const playerDataList = typeof data.data.players === 'string'
          ? JSON.parse(data.data.players)
          : data.data.players;
        updatePlayerList(playerDataList);
      } else if (data.type === "game_started") {
        window.location.href = `#game?id=${roomId}`;
      }
    } catch (err) {
      console.error("Failed to handle incoming message:", err);
    }
  }

  function submitStart(){
    const typingTimeEl = document.getElementById("typing-time-slider");
    const characterGoalEl = document.getElementById("character-goal-slider");
    const languageEl = document.getElementById("languages-dropdown");
    const typingTime = typingTimeEl ? typingTimeEl.value : 60;
    const characterGoal = characterGoalEl ? characterGoalEl.value : 120;
    const language = languageEl ? languageEl.value : 'english';
    if (!window.socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("Socket not open");
      return;
    }
    socket.send(JSON.stringify({
      type: "start_game",
      data: {
        roomCode: roomId,
        host: sessionStorage.getItem("username"),
        settings: {
          typingTime,
          characterGoal,
          language
        }
      }
    }));
  }

  function onStartClick(e){ e.preventDefault(); submitStart(); }
  function onStartSubmit(e){ e.preventDefault(); submitStart(); }

  function init(){
    roomCodeButton = document.getElementById("room-code-button");
    playerListContainer = document.getElementById("players-list");
    startButton = document.getElementById("start-game-button");
    form = document.getElementById("room-settings-form");

    const hash = window.location.hash.substring(1);
    const [route, queryString] = hash.split('?');
    const hashParams = new URLSearchParams(queryString || '');
    roomId = hashParams.get('id') || null;

    if (roomCodeButton) roomCodeButton.innerText = roomId || "Error";
    if (roomCodeButton) roomCodeButton.addEventListener("click", copyRoomCode);
    if (form) form.addEventListener("submit", onStartSubmit);
    if (startButton) startButton.addEventListener("click", onStartClick);
    if (window.socket && socket.addEventListener) socket.addEventListener("message", onSocketMessage);

    loadPlayersFromSessionOrInitialData();
  }

  function destroy(){
    if (roomCodeButton) roomCodeButton.removeEventListener("click", copyRoomCode);
    if (form) form.removeEventListener("submit", onStartSubmit);
    if (startButton) startButton.removeEventListener("click", onStartClick);
    if (window.socket && socket.removeEventListener) socket.removeEventListener("message", onSocketMessage);
  }

  window.__cleanup = destroy;
  init();
})();
