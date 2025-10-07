(function () {
    let roomSettings = {};
    let questionPlaceholder = "";
    let timerInterval = null;
    let roomId = null;

    // ===========================
    // WebSocket & Game Initialization
    // ===========================
    function startGame(roomId) {
        socket.send(JSON.stringify({
            type: "initialize_game",
            data: {
                roomCode: roomId,
                username: sessionStorage.getItem("username")
            }
        }));
    }

    socket.onmessage = function (event) {
        try {
            const response = JSON.parse(event.data);
            console.log("Received data:", response);

            switch (response.type) {
                case "game_started":
                    roomSettings = response.data.settings;
                    initializeGame();
                    break;
                case "start_new_round":
                    questionPlaceholder = response.data.question;
                    startNewRound(response.data.question);
                    break;
                case "player_guessed_incorrectly":
                    handleIncorrectGuess();
                    break;
                case "player_guessed_correctly":
                    handleCorrectGuess(response.data);
                    break;
                case "player_has_won":
                    handlePlayerHasWon(response.data);
                    break;
                case "player_left":
                    handlePlayerLeft(response.data);
                    break;
                case "return_to_lobby":
                    handleReturnToLobby(response.data);
                    break;
                default:
                    console.warn("Unhandled message type:", response.type);
            }
        } catch (err) {
            console.error("Failed to handle incoming message:", err);
        }
    };

    const hashTag = window.location.hash.substring(1);
    const [routeData, queryStr] = hashTag.split('?');
    const hashParameters = new URLSearchParams(queryStr);
    roomId = hashParameters.get('id');
    if (roomId) startGame(roomId);

    // ===========================
    // UI Helpers
    // ===========================
    function createElement(tag, options = {}, children = []) {
        const el = document.createElement(tag);
        Object.entries(options).forEach(([key, value]) => {
            if (key === "className") el.className = value;
            else if (key === "textContent") el.textContent = value;
            else if (key === "src") el.src = value;
            else if (key === "alt") el.alt = value;
            else el.setAttribute(key, value);
        });
        children.forEach(child => el.appendChild(child));
        return el;
    }

    function getOrCreateCenter() {
        let center = document.querySelector(".center");
        if (!center) {
            center = createElement("div", { className: "center" });
            document.body.appendChild(center);
        }
        return center;
    }

    // ===========================
    // Game Initialization
    // ===========================
    function initializeGame() {
        const center = getOrCreateCenter();
        loadPlayers();
        const waitingText = document.getElementById("game-waiting-text");
        if (waitingText) center.removeChild(waitingText);

        startCountdown(center, () => {
            console.log("Countdown finished, server is starting first round...");
        });
    }

    function loadPlayers() {
        const container = document.getElementById("players-container");
        if (!container) return;

        const playersList = JSON.parse(sessionStorage.getItem("playersList") || "[]");
        if (container.children.length > 0) return;

        playersList.forEach((player, index) => {
            const circleDiv = createElement("div", { className: "circle" }, [
                createElement("span", { className: "characters-count", textContent: "0" }),
                document.createTextNode("/"),
                createElement("span", { className: "characters-goal", textContent: roomSettings.characterGoal }),
                createElement("img", { src: player.skinPath || "/assets/default-avatar.png", alt: `${player.username}'s avatar`, style: "width:120%;" }),
                createElement("span", { className: "name", textContent: player.username })
            ]);

            const playerDiv = createElement("div", { id: player.username, className: `player p${index + 1}` }, [circleDiv]);
            container.appendChild(playerDiv);
        });
    }

    // ===========================
    // Countdown Functions
    // ===========================
    function startCountdown(container, onFinish) {
        if (document.getElementById("round-countdown-overlay")) return;

        const countdownElement = createElement("span", { id: "round-countdown" });
        const overlay = createElement("div", { id: "round-countdown-overlay" }, [countdownElement]);
        document.body.appendChild(overlay);

        let countdown = 5;
        countdownElement.textContent = countdown;

        const interval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(interval);
                overlay.remove();
                if (typeof onFinish === "function") onFinish();
            }
        }, 1000);
    }

    function startTimerCountdown() {
        const timer = document.getElementById("time-left");
        if (!timer) return;
        let timeLeft = parseInt(timer.innerText, 10);

        if (timerInterval !== null) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                timer.innerText = "0";
                console.log("Time's up!");
            } else {
                timeLeft--;
                timer.innerText = timeLeft;
            }
        }, 1000);
    }

    // ===========================
    // Round Handling
    // ===========================
    function startNewRound(question) {
        const timeToType = roomSettings.typingTime || 60;
        const center = getOrCreateCenter();

        const timerLabel = document.getElementById("time-left");
        if (timerLabel) timerLabel.textContent = timeToType;

        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const existingCountdown = document.getElementById("round-countdown-overlay");
        if (existingCountdown) existingCountdown.remove();

        startTimerCountdown();

        let userInput = document.getElementById("user-text-input");
        if (!userInput) {
            userInput = createElement("textarea");
            center.appendChild(userInput);
        }

        userInput.className = "";
        userInput.disabled = false;
        userInput.id = "user-text-input";
        userInput.placeholder = question;
        userInput.value = "";

        questionPlaceholder = question;
        listenForTextInput();
        userInput.focus();
    }

    function listenForTextInput() {
        const userInput = document.getElementById("user-text-input");
        if (!userInput) return;

        document.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                handleWordSubmission();
            }
        });
    }

    function handleWordSubmission() {
        const userInput = document.getElementById("user-text-input");
        if (!userInput) return;

        const word = userInput.value.toLowerCase().trim();
        if (word) {
            socket.send(JSON.stringify({
                type: "word_submission",
                data: {
                    roomCode: roomId,
                    sender: sessionStorage.getItem("username"),
                    word
                }
            }));
            userInput.value = "";
        }
    }

    // ===========================
    // Guess Handling
    // ===========================
    function handleIncorrectGuess() {
        const userInput = document.getElementById("user-text-input");
        if (!userInput) return;

        userInput.placeholder = "incorrect word";
        userInput.classList.add("error");
        userInput.disabled = true;

        setTimeout(() => {
            userInput.placeholder = questionPlaceholder;
            userInput.classList.remove("error");
            userInput.disabled = false;
        }, 1000);
    }

    function handleCorrectGuess(data) {
        const playerDiv = document.getElementById(data.playerName);
        if (!playerDiv) return;

        const userInput = document.getElementById("user-text-input");
        const charactersCount = playerDiv.querySelector(".characters-count");
        let previous = parseInt(charactersCount.textContent, 10) || 0;
        let current = parseInt(data.currentTotalCharacters, 10) || 0;

        charactersCount.textContent = current;

        if (data.playerName === sessionStorage.getItem("username")) {
            const wordLength = current - previous;
            userInput.placeholder = `correct answer!\n+${wordLength} characters`;
            userInput.classList.add("correct");
            userInput.disabled = true;
        }
    }

    // ===========================
    // Player & Winner Handling
    // ===========================
    function handlePlayerHasWon(data) {
        const playerName = data.username;
        const playerSkin = data.skinPath ? data.skinPath.replace(/\\/g, "/") : "/src/assets/skins/default-skin.png";

        const textInput = document.getElementById("user-text-input");
        if (textInput) textInput.remove();

        const overlay = createElement("div", { id: "winner-overlay" }, [
            createElement("img", { id: "winner-avatar", src: playerSkin, alt: `${playerName}'s avatar` }),
            createElement("h1", { id: "win-message", textContent: `${playerName} has won!!` })
        ]);

        document.body.appendChild(overlay);
    }

    function handlePlayerLeft(data) {
        const playerDiv = document.getElementById(data.username);
        if (playerDiv && playerDiv.parentNode) playerDiv.parentNode.removeChild(playerDiv);

        let playersList = JSON.parse(sessionStorage.getItem("playersList") || "[]");
        playersList = playersList.filter(player => player.username !== data.username);
        sessionStorage.setItem("playersList", JSON.stringify(playersList));
    }

    function handleReturnToLobby(data) {
        const winnerOverlay = document.getElementById("winner-overlay");
        if (winnerOverlay) winnerOverlay.remove();

        const userInput = document.getElementById("user-text-input");
        if (userInput) userInput.remove();

        if (data && data.roomCode) {
            document.location.hash = `#lobby?id=${data.roomCode}`;
        } else {
            console.warn("No room code provided for returning to lobby.");
        }
    }
})();
