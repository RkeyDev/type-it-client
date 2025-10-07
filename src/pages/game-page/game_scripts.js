(function() {
    let roomSettings = {};
    let questionPlacehoder = "";
    let timerInterval = null;

    function startGame(roomId) {
        socket.send(JSON.stringify({
            type: "initialize_game",
            data: { 
                roomCode: roomId,
                username: sessionStorage.getItem("username")
             }
        }));
    }

    function handlePlayerHasWon(data) {
        const playerName = data.username;
        const playerSkin = data.skinPath ? data.skinPath.replace(/\\/g, "/") : "/src/assets/skins/default-skin.png";

        const textInput = document.getElementById("user-text-input");
        if (textInput) textInput.remove();

        const overlay = document.createElement("div");
        overlay.id = "winner-overlay";


        const img = document.createElement("img");
        img.id = "winner-avatar";
        img.src = playerSkin;
        img.alt = `${playerName}'s avatar`;
        

        const message = document.createElement("h1");
        message.id = "win-message";
        message.textContent = `${playerName} has won!!`;
        

        overlay.appendChild(img);
        overlay.appendChild(message);
        document.body.appendChild(overlay);
    }

    function loadPlayers() {
        const playersContainer = document.getElementById("players-container");
        if (!playersContainer) return;

        const playersList = JSON.parse(sessionStorage.getItem("playersList") || "[]");
        if(playersContainer.children.length > 0) return;

        playersList.forEach((player, index) => {
            const playerDiv = document.createElement("div");
            playerDiv.id = player.username;
            playerDiv.className = `player p${index + 1}`;

            const circleDiv = document.createElement("div");
            circleDiv.className = "circle";

            const charactersCount = document.createElement("span");
            charactersCount.className = "characters-count";
            charactersCount.textContent = "0";

            const slash = document.createTextNode("/");
            const charactersGoal = document.createElement("span");
            charactersGoal.className = "characters-goal";
            charactersGoal.textContent = roomSettings.characterGoal;

            const img = document.createElement("img");
            img.src = player.skinPath || "/assets/default-avatar.png";
            img.alt = `${player.username}'s avatar`;
            img.style.width = "120%";

            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = player.username;

            circleDiv.appendChild(charactersCount);
            circleDiv.appendChild(slash);
            circleDiv.appendChild(charactersGoal);
            circleDiv.appendChild(img);
            circleDiv.appendChild(nameSpan);

            playerDiv.appendChild(circleDiv);
            playersContainer.appendChild(playerDiv);
        });
    }

    function initializeGame() {
    let center = document.querySelector(".center");
    if (!center) {
        center = document.createElement("div");
        center.className = "center";
        document.body.appendChild(center); // append it!
    }

    loadPlayers();

    const gameWaitingText = document.getElementById("game-waiting-text");
    if (gameWaitingText) center.removeChild(gameWaitingText);

    startCountdown(center, () => {
        console.log("Countdown finished, server is starting first round...");
    });
}


    function startCountdown(container, onFinish) {
        if(document.getElementById("round-countdown-overlay")) return;

        let overlay = document.createElement("div");
        overlay.id = "round-countdown-overlay";


        let countdownElement = document.createElement("span");
        countdownElement.id = "round-countdown";
        
        overlay.appendChild(countdownElement);

        document.body.appendChild(overlay);

        let countdown = 5;
        countdownElement.textContent = countdown;

        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                overlay.remove();
                if (typeof onFinish === "function") onFinish();
            }
        }, 1000);
    }

    function startTimerCountdown() {
        const timer = document.getElementById("time-left");
        if (!timer) return;
        let timeLeft = parseInt(timer.innerText, 10);

        if (timerInterval !== null) {
            clearInterval(timerInterval);
        }

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

    function startNewRound(question) {
        const timeToType = roomSettings.typingTime || 60;
        const center = document.querySelector(".center");
        if (!center) {
            center = document.createElement("div");
            center.className = "center";
        };

        const timeLeftLabel = document.getElementById("time-left");
        if (timeLeftLabel) timeLeftLabel.textContent = timeToType;

        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const existingCountdown = document.getElementById("round-countdown-overlay");
        if (existingCountdown) existingCountdown.remove();

        startTimerCountdown();

        let userTextInput = document.getElementById("user-text-input");
        if (!userTextInput){
            userTextInput = document.createElement("textarea");
            center.appendChild(userTextInput);
        }

        userTextInput.classList = "";
        userTextInput.disabled = false;
        userTextInput.id = "user-text-input";
        userTextInput.placeholder = question;
        userTextInput.value = "";

        questionPlacehoder = question;
        listenForTextInput();

        userTextInput.focus();
    }

    function listenForTextInput() {
        const userTextInput = document.getElementById("user-text-input");
        if (!userTextInput) return;

        document.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                handleWordSubmission();
            }
        });
    }

    function handleWordSubmission() {
        const userTextInput = document.getElementById("user-text-input");
        if (!userTextInput) return;
        const userInput = userTextInput.value.toLowerCase().trim();

        if (userInput) {
            socket.send(JSON.stringify({
                type: "word_submission",
                data: {
                    roomCode: room_id,
                    sender: sessionStorage.getItem("username"),
                    word: userInput
                }
            }));
            userTextInput.value = "";
        }
    }

    function handleIncorrectGuess() {
        const userTextInput = document.getElementById("user-text-input");
        if (!userTextInput) return;

        userTextInput.placeholder = "incorrect word";
        userTextInput.classList.add("error");
        userTextInput.disabled = true;

        setTimeout(() => {
            userTextInput.placeholder = questionPlacehoder;
            userTextInput.classList.remove("error");
            userTextInput.disabled = false;
        }, 1000);
    }

    function handleCorrectGuess(data) {
        const playerDiv = document.getElementById(data.playerName);
        if (!playerDiv) return;

        const userTextInput = document.getElementById("user-text-input");
        const currentCharactersText = playerDiv.querySelector(".characters-count");
        let previousWordLength = parseInt(currentCharactersText.textContent, 10) || 0;
        let currentTotalCharacters = parseInt(data.currentTotalCharacters, 10) || 0;

        currentCharactersText.textContent = currentTotalCharacters;

        if (data.playerName === sessionStorage.getItem("username")) {
            let wordLength = currentTotalCharacters - previousWordLength;
            userTextInput.placeholder = "correct answer!\n+" + wordLength + " characters";
            userTextInput.classList.add("correct");
            userTextInput.disabled = true;
        }
    }

    function handlePlayerLeft(data) {
        const { username } = data;
        const playerDiv = document.getElementById(username);
        if (playerDiv && playerDiv.parentNode) playerDiv.parentNode.removeChild(playerDiv);

        let playersList = JSON.parse(sessionStorage.getItem("playersList") || "[]");
        playersList = playersList.filter(player => player.username !== username);
        sessionStorage.setItem("playersList", JSON.stringify(playersList));
    }


    function handleReturnToLobby(data) {
    // Remove winner overlay if present
    const winnerOverlay = document.getElementById("winner-overlay");
    if (winnerOverlay) {
        winnerOverlay.remove();
    }

    // Remove the user text input
    const userTextInput = document.getElementById("user-text-input");
    if (userTextInput) userTextInput.remove();

    // Redirect to lobby hash
    if (data && data.roomCode) {
        document.location.hash = `#lobby?id=${data.roomCode}`;
    } else {
        console.warn("No room code provided for returning to lobby.");
    }
}

    socket.onmessage = function(event) {
        try {
            const response = JSON.parse(event.data);
            console.log("Received data:", response);

            switch (response.type) {
                case "game_started":
                    roomSettings = response.data.settings;
                    initializeGame();
                    break;
                case "start_new_round":
                    questionPlacehoder = response.data.question;
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
                    console.warn("Unhandled message type:", data.type);
            }
        } catch (err) {
            console.error("Failed to handle incoming message:", err);
        }
    };

    const hashTag = window.location.hash.substring(1);
    const [routeData, queryStr] = hashTag.split('?');
    const hashParameters = new URLSearchParams(queryStr);
    const room_id = hashParameters.get('id');
    if (room_id) startGame(room_id);
})();
