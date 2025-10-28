(function () {
    let roomSettings = {};
    let questionPlaceholder = "";
    let timerInterval = null;
    let roomId = null;
    let gameInitialized = false;

    const correct_guess_sound = new Audio('./src/assets/sounds/correct-guess-sound.mp3');
    const countdown_sound = new Audio("./src/assets/sounds/countdown-sound.mp3");
    const start_game_sound = new Audio("./src/assets/sounds/game-start-sound-effect.mp3");
    const new_round_sound = new Audio("./src/assets/sounds/new_round_sound.mp3");
    const wrong_guess_sound = new Audio("./src/assets/sounds/wrong-guess-sound.mp3");
    const someone_guessed_correctly_sound = new Audio("./src/assets/sounds/someone-guessed-correctly-sound.mp3");
    
    function startGame(roomId) {
        socket.send(JSON.stringify({
            type: "initialize_game",
            data: {
                roomCode: roomId
            }
        }));
    }

    socket.onmessage = function (event) {
        try {
            const response = JSON.parse(event.data);
            switch (response.type) {
                case "game_started":
                    roomSettings = response.data.settings;
                    initializeGame();
                    break;
                case "start_new_round":
                    const data = response.data;
                    if (!gameInitialized) {
                        const checkReady = setInterval(() => {
                            if (gameInitialized) {
                                clearInterval(checkReady);
                                questionPlaceholder = data.question;
                                startNewRound(data.question);
                            }
                        }, 100);
                    } else {
                        questionPlaceholder = data.question;
                        startNewRound(data.question);
                    }
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

    function initializeGame() {
        const center = getOrCreateCenter();
        loadPlayers();
        const waitingText = document.getElementById("game-waiting-text");
        if (waitingText && waitingText.parentNode) waitingText.remove();
        gameInitialized = true;
        countdown_sound.currentTime = 0;
        countdown_sound.volume = 0.5;
        countdown_sound.play();
        startCountdown(center, () => {});
    }

    function loadPlayers() {
        const container = document.getElementById("players-container");
        if (!container) return;
        const playersList = JSON.parse(sessionStorage.getItem("playersList") || "[]");
        if (container.children.length > 0) return;

        playersList.forEach((player, index) => {
            const progressRow = createElement("div", { className: "progress-row" }, [
                createElement("span", { className: "characters-count", textContent: "0" }),
                createElement("span", { className: "divider", textContent: "/" }),
                createElement("span", { className: "characters-goal", textContent: roomSettings.characterGoal })
            ]);

            const imgEl = createElement("img", { src: player.skinPath, alt: `${player.username}'s avatar`, className: "avatar-img" });
            const nameSpan = createElement("span", { className: "name", textContent: player.username });
            const circleDiv = createElement("div", { className: "circle" }, [progressRow, imgEl, nameSpan]);
            const playerDiv = createElement("div", { id: player.username, className: `player p${index + 1}` }, [circleDiv]);
            container.appendChild(playerDiv);
        });
    }

    function startCountdown(container, onFinish) {
        if (document.getElementById("round-countdown-overlay")) return;
        const countdownElement = document.createElement("span");
        countdownElement.id = "round-countdown";
        countdownElement.style.transition = "transform 0.3s ease, opacity 0.3s ease";
        countdownElement.style.display = "inline-block";
        countdownElement.style.fontSize = "5rem";
        countdownElement.style.opacity = 0;
        const overlay = document.createElement("div");
        overlay.id = "round-countdown-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.background = "rgba(0,0,0,0.5)";
        overlay.appendChild(countdownElement);
        document.body.appendChild(overlay);
        let countdown = 6;

        function updateCountdown() {
            countdown--;
            if (countdown > 1) {
                countdown_sound.currentTime = 0;
                countdown_sound.play();
            } else if (countdown == 1) {
                start_game_sound.play();
            } else if (countdown == 0) {
                new_round_sound.play();
            }
            countdownElement.style.opacity = 0;
            countdownElement.style.transform = "scale(0.5)";
            setTimeout(() => {
                if (countdown - 1 >= 0) {
                    countdownElement.textContent = countdown === 1 ? "Type It!" : countdown - 1;
                    countdownElement.style.opacity = 1;
                    countdownElement.style.transform = "scale(1)";
                }
            }, 100);
            if (countdown <= 0) {
                clearInterval(interval);
                setTimeout(() => overlay.remove(), 300);
                if (typeof onFinish === "function") onFinish();
            }
        }

        countdownElement.textContent = countdown - 1;
        countdownElement.style.opacity = 1;
        countdownElement.style.transform = "scale(1)";
        const interval = setInterval(updateCountdown, 1000);
    }

    function startTimerCountdown() {
        const timer = document.getElementById("time-left");
        if (!timer) return;
        timer.classList.add("show");
        let timeLeft = parseInt(timer.innerText, 10);
        if (timerInterval !== null) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timer.innerText = "0";
            } else {
                timeLeft--;
                timer.style.animation = "none";
                void timer.offsetWidth;
                timer.innerText = timeLeft;
                timer.style.animation = "numberBounce 0.4s ease";
            }
        }, 1000);
    }

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

        // Return all character-count texts to white
        document.querySelectorAll(".progress-row span").forEach(el => el.style.color = "white");
 

        userInput.style.transition = "transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.4s ease";
        userInput.style.opacity = 0;
        userInput.style.transform = "translateY(20px) scale(0.95)";
        requestAnimationFrame(() => {
            userInput.style.opacity = 1;
            userInput.style.transform = "translateY(0) scale(1)";
        });
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

    function handleIncorrectGuess() {
        const userInput = document.getElementById("user-text-input");
        if (!userInput) return;
        wrong_guess_sound.currentTime = 0;
        wrong_guess_sound.play();
        userInput.placeholder = "incorrect word";
        userInput.classList.add("error");
        userInput.disabled = true;
        setTimeout(() => {
            userInput.placeholder = questionPlaceholder;
            userInput.classList.remove("error");
            userInput.disabled = false;
            userInput.focus();
        }, 1000);
    }

    function spawnConfettiFromElement(element, amount = 25) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        for (let i = 0; i < amount; i++) {
            const confetti = document.createElement("div");
            confetti.className = "confetti-particle";
            confetti.style.position = "fixed";
            confetti.style.left = `${originX}px`;
            confetti.style.top = `${originY}px`;
            confetti.style.width = "8px";
            confetti.style.height = "8px";
            confetti.style.borderRadius = "2px";
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
            confetti.style.pointerEvents = "none";
            confetti.style.opacity = "1";
            document.body.appendChild(confetti);
            const angle = Math.random() * Math.PI * 2;
            const velocity = 4 + Math.random() * 4;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity;
            let y = originY, x = originX, life = 0;
            const fall = () => {
                life += 1;
                x += dx;
                y += dy + life * 0.1;
                confetti.style.transform = `translate(${x - originX}px, ${y - originY}px) rotate(${life * 10}deg)`;
                confetti.style.opacity = `${1 - life / 60}`;
                if (life < 60) requestAnimationFrame(fall);
                else confetti.remove();
            };
            requestAnimationFrame(fall);
        }
    }

    function handleCorrectGuess(data) {
        const playerDiv = document.getElementById(data.playerName);
        if (!playerDiv) return;
        const userInput = document.getElementById("user-text-input");
        const charactersCount = playerDiv.querySelector(".characters-count");
        let previous = parseInt(charactersCount.textContent, 10) || 0;
        let current = parseInt(data.currentTotalCharacters, 10) || 0;
        charactersCount.textContent = current;
        playerDiv.querySelectorAll(".progress-row span").forEach(span => {
        span.style.color = "limegreen";
    });
        if (data.playerName === sessionStorage.getItem("username")) {
            const wordLength = current - previous;
            userInput.placeholder = `correct answer!\n+${wordLength} characters`;
            userInput.classList.add("correct");
            userInput.disabled = true;
            
            correct_guess_sound.currentTime = 0;
            correct_guess_sound.playbackRate = 1.5;
            correct_guess_sound.play();
        } else {
            someone_guessed_correctly_sound.play();
        }
        const skin = playerDiv.querySelector("img");
        if (skin) spawnConfettiFromElement(skin);
    }

    function handlePlayerHasWon(data) {
        const playerName = data.username;
        const playerSkin = data.skinPath ? data.skinPath.replace(/\\/g, "/") : "./src/assets/skins/deafult_yellow_skin.webp";
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
        if (playerDiv) {
            playerDiv.style.transition = "opacity 0.4s ease, transform 0.4s ease";
            playerDiv.style.opacity = 0;
            playerDiv.style.transform = "scale(0.7)";
            setTimeout(() => {
                if (playerDiv.parentNode) playerDiv.parentNode.removeChild(playerDiv);
            }, 400);
        }
        let playersList = JSON.parse(sessionStorage.getItem("playersList") || "[]");
        playersList = playersList.filter(player => player.username !== data.username);
        sessionStorage.setItem("playersList", JSON.stringify(playersList));
    }

    function handleReturnToLobby(data) {
        if (data.host === sessionStorage.getItem("username")) {
            sessionStorage.setItem("host", "true");
        } else {
            sessionStorage.setItem("host", "false");
        }
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
