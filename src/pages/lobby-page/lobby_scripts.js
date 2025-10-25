(function() {
  let roomId = null;
  let roomCodeButton = null;
  let playerListContainer = null;
  let startButton = null;
  let form = null;
  const roomSettingsContainer = document.getElementById("room-settings-container");
  let room_settings_form = document.getElementById("room-settings-form");
  let roomSettingsContainerBackup = roomSettingsContainer.innerHTML;

  const slider_move_sound = new Audio('./src/assets/sounds/slider-move-sound.mp3');
  const typingTimeEl = document.getElementById("typing-time-slider");
  const characterGoalEl = document.getElementById("character-goal-slider");
  const matchmakingToggle = document.getElementById("matchmaking-toggle");
  const matchmakingToggleLabel = document.getElementById("matchmaking-toggle-label");

  slider_move_sound.volume = 0.3;

  typingTimeEl.addEventListener("input", () => slider_move_sound.play());
  characterGoalEl.addEventListener("input", () => slider_move_sound.play());

  function copyRoomCode() {
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

  function updatePlayerList(playerDataList) {
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

  function updateRoomSettingsFromServer(data) {
    if (!data || sessionStorage.getItem("host") !== "true") return;

    if (typingTimeEl && data.typingTime !== undefined)
      typingTimeEl.value = data.typingTime;

    if (characterGoalEl && data.characterGoal !== undefined)
      characterGoalEl.value = data.characterGoal;

    if (matchmakingToggle && data.matchMaking !== undefined) {
      matchmakingToggle.checked = data.matchMaking === true || data.matchMaking === "true";
      if (matchmakingToggleLabel)
        matchmakingToggleLabel.textContent = matchmakingToggle.checked ? "On" : "Off";
    }
  }


  function rebindRoomSettingsEvents() {
  // re-select new elements
  form = document.getElementById("room-settings-form");
  startButton = document.getElementById("start-game-button");
  
  const newTypingTimeEl = document.getElementById("typing-time-slider");
  const newCharacterGoalEl = document.getElementById("character-goal-slider");
  const newMatchmakingToggle = document.getElementById("matchmaking-toggle");
  const newMatchmakingToggleLabel = document.getElementById("matchmaking-toggle-label");

  // rebind slider sounds
  newTypingTimeEl?.addEventListener("input", () => slider_move_sound.play());
  newCharacterGoalEl?.addEventListener("input", () => slider_move_sound.play());

  // rebind matchmaking toggle
  if (newMatchmakingToggle) {
    newMatchmakingToggle.addEventListener("change", () => {
      if (!window.socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("Socket not open");
        return;
      }

      if (newMatchmakingToggleLabel)
        newMatchmakingToggleLabel.textContent = newMatchmakingToggle.checked ? 'On' : 'Off';

      const username = sessionStorage.getItem("username") || "";
      socket.send(JSON.stringify({
        type: "toggle_matchmaking",
        data: {
          allow_matchmaking: newMatchmakingToggle.checked.toString(),
          username: username,
          roomCode: roomId
        }
      }));
    });
  }

  // rebind start button + form
  if (form) form.addEventListener("submit", onStartSubmit);
  if (startButton) startButton.addEventListener("click", onStartClick);
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

      if (roomCodeButton)
        roomCodeButton.innerText = roomId || roomCodeButton.innerText || "Error";

      updateRoomSettingsFromServer(parsedRoomData.data);
    } catch (err) {
      console.error("Failed to load room data from session:", err);
    }

    sessionStorage.removeItem("initialRoomData");
  }

  function onSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "update_room") {
        const playerDataList = typeof data.data.players === 'string'
          ? JSON.parse(data.data.players)
          : data.data.players;

        updatePlayerList(playerDataList);
        updateRoomSettingsFromServer(data.data);

      } else if (data.type === "game_started") {
        window.location.href = `#game?id=${roomId}`;
      }
      else if(data.type === "new_host"){
        setPlayerToHost();
      }
    } catch (err) {
      console.error("Failed to handle incoming message:", err);
    }
  }

  function setPlayerToHost() {
    // restore the original room settings form if it was cleared
    if (!document.getElementById("room-settings-form")) {
      roomSettingsContainer.innerHTML = roomSettingsContainerBackup;
    }

    // reselect the form after restoring
    room_settings_form = document.getElementById("room-settings-form");
    room_settings_form.style.visibility = "visible";

    sessionStorage.setItem("host", "true");

    // rebind all events to the new DOM
    rebindRoomSettingsEvents();
  }



  function submitStart() {
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

  function onStartClick(e) {
    e.preventDefault();
    submitStart();
  }

  function onStartSubmit(e) {
    e.preventDefault();
    submitStart();
  }

  function init() {
    roomCodeButton = document.getElementById("room-code-button");
    playerListContainer = document.getElementById("players-list");
    startButton = document.getElementById("start-game-button");
    form = document.getElementById("room-settings-form");

    const hash = window.location.hash.substring(1);
    const [route, queryString] = hash.split('?');
    const hashParams = new URLSearchParams(queryString || '');
    roomId = hashParams.get('id') || null;

    if (matchmakingToggle) {
      matchmakingToggle.addEventListener("change", () => {
        if (!window.socket || socket.readyState !== WebSocket.OPEN) {
          console.warn("Socket not open");
          return;
        }

        if (matchmakingToggleLabel)
          matchmakingToggleLabel.textContent = matchmakingToggle.checked ? 'On' : 'Off';

        const username = sessionStorage.getItem("username") || "";
        socket.send(JSON.stringify({
          type: "toggle_matchmaking",
          data: {
            allow_matchmaking: matchmakingToggle.checked.toString(),
            username: username,
            roomCode: roomId
          }
        }));
      });
    }

    if (roomCodeButton) roomCodeButton.innerText = roomId || "Error";
    if (roomCodeButton) roomCodeButton.addEventListener("click", copyRoomCode);
    if (form) form.addEventListener("submit", onStartSubmit);
    if (startButton) startButton.addEventListener("click", onStartClick);
    if (window.socket && socket.addEventListener)
      socket.addEventListener("message", onSocketMessage);

    if (sessionStorage.getItem("host") === "false")
      setSettingsDisabled();
    else
      room_settings_form.style.visibility = "visible";
      

    loadPlayersFromSessionOrInitialData();
  }

  function destroy() {
    if (roomCodeButton) roomCodeButton.removeEventListener("click", copyRoomCode);
    if (form) form.removeEventListener("submit", onStartSubmit);
    if (startButton) startButton.removeEventListener("click", onStartClick);
    if (window.socket && socket.removeEventListener)
      socket.removeEventListener("message", onSocketMessage);
  }

  function setSettingsDisabled() {
    const form = document.querySelector("form");
    if (form) form.style.visibility = "hidden";

    
    roomSettingsContainer.innerHTML = "";
    room_settings_form.style.visibility = "visible";
    const wrapper = document.createElement("div");
    wrapper.className = "waiting-wrapper";

    const header = document.createElement("h2");
    header.className = "waiting-header";
    header.innerText = "Waiting for the host to start the game...";

    const dots = document.createElement("div");
    dots.className = "waiting-dots";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = `dot dot-${i + 1}`;
      dots.appendChild(dot);
    }

    wrapper.appendChild(header);
    wrapper.appendChild(dots);
    roomSettingsContainer.appendChild(wrapper);
  }

  window.__cleanup = destroy;
  init();
})();
