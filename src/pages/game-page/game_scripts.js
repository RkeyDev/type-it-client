let roomSettings = {};

/**
 * Handles incoming socket messages and updates game accordingly.
 */

let questionPlacehoder = "";

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("Received data:", data);

        

        switch (data.type) {
            case "game_started":
                roomSettings = data.data.settings;
                initializeGame(); // Show countdown only
                break;
            case "start_new_round":
                questionPlacehoder = data.data.question;
                startNewRound(data.data.question); // Display the round
                break;
            case "player_guessed_incorrectly":
                handleIncorrectGuess();
                break;
            case "player_guessed_correctly":
                handleCorrectGuess(data.data);
                break;
            case "player_has_won":
                handlePlayerHasWon(data.data);
            case "player_left":
                handlePlayerLeft(data.data);
            default:
                console.warn("Unhandled message type:", data.type);
        }
    } catch (err) {
        console.error("Failed to handle incoming message:", err);
    }
};

/**
 * Sends a request to the server to initialize the game
 */
function startGame(roomId) {
    socket.send(JSON.stringify({
        type: "initialize_game",
        data: { roomCode: roomId }
    }));
}


function handlePlayerHasWon(data) {
    const playerName = data.username;

    const textInput = document.getElementById("user-text-input");

    // Create a new element to display the message
    const message = document.createElement("h1");
    message.textContent = `${playerName} has won!!`;

    // Replace the input with the message
    textInput.parentNode.replaceChild(message, textInput);
}


function loadPlayers(){
    const playersContainer = document.getElementById("players-container");
    const playersList = JSON.parse(sessionStorage.getItem("playersList") || "[]");

    if(playersContainer.children.length > 0) return; // Players already loaded

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
        img.src = player.skinPath || "/assets/default-avatar.png"; // Default avatar if none provided
        img.alt = `${player.name}'s avatar`;
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



/**
 * Initializes the game on the client-side
 * Only shows a countdown; the server will start the round
 */
function initializeGame() {
    const center = document.querySelector(".center");
    const gameWaitingText = document.getElementById("game-waiting-text");
    
    if (!center) {
        console.error("Center container not found!");
        return;
    }

    loadPlayers();

    // Remove waiting text if present
    if (gameWaitingText) center.removeChild(gameWaitingText);

    // Run visual countdown before first round
    startCountdown(center, () => {
        console.log("Countdown finished, requesting server to start first round...");

        // Tell server to start the first round
        socket.send(JSON.stringify({
            type: "start_new_round",
            data: { roomCode: room_id }
        }));
    });
}


/**
 * Displays a countdown (5 → 0) in the given container
 * Calls onFinish when done
 */
function startCountdown(container, onFinish) {
    if(document.getElementById("round-countdown")) return; // Countdown already running

    const countdownElement = document.createElement("span");
    countdownElement.id = "round-countdown";
    countdownElement.style.fontSize = "2rem";
    countdownElement.style.fontWeight = "bold";
    countdownElement.style.textAlign = "center";
    container.appendChild(countdownElement);

    let countdown = 5;
    countdownElement.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            countdownElement.remove();

            if (typeof onFinish === "function") onFinish();
        }
    }, 1000);
}


let timerInterval = null; // store interval globally

function startTimerCountdown() {
    const timer = document.getElementById("time-left");
    let timeLeft = parseInt(timer.innerText, 10);

    if (timerInterval !== null) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timer.innerText = "0";

            // Disable input so user cannot type after timer ends
            const userTextInput = document.getElementById("user-text-input");
            if (userTextInput) {
                userTextInput.disabled = true;
            }

            console.log("Time's up!");
        } else {
            timeLeft--;
            timer.innerText = timeLeft;
        }
    }, 1000);
}



/**
 * Starts a new round by displaying the question in a textarea
 */
function startNewRound(question) {
    console.log(roomSettings);
    const timeToType = roomSettings.typingTime; // seconds to type
    
    const center = document.querySelector(".center");
    const timeLeftLabel = document.getElementById("time-left");

    if (timeLeftLabel) timeLeftLabel.textContent = timeToType;

    startTimerCountdown();
    let userTextInput = document.getElementById("user-text-input");
    if (!userTextInput){
        // Create textarea for user input
        userTextInput = document.createElement("textarea");

        // Clear previous content and append new textarea
        center.appendChild(userTextInput);
    }
    userTextInput.classList = ""; // Reset class list
    userTextInput.disabled = false;
    userTextInput.id = "user-text-input";
    userTextInput.placeholder = question; // Use question from server
    userTextInput.value = "";
    
    
    listenForTextInput();
}


/**
 * Listens for user typing and Enter key
 */
function listenForTextInput() {
    const userTextInput = document.getElementById("user-text-input");
    if (!userTextInput) {
        console.error("User text input not found!");
        return;
    }

    // Listen for Enter key
    document.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent newline or form submit
            handleWordSubmission();
        }
    });
}

/**
 * Handles submitting a word to the server
 */
function handleWordSubmission() {
    const userTextInput = document.getElementById("user-text-input");
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

        userTextInput.value = ""; // Clear after sending
    }
}


function handleIncorrectGuess() {
    const userTextInput = document.getElementById("user-text-input");
    console.log("Incorrect guess received for question:", questionPlacehoder);
    
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
    const userTextInput = document.getElementById("user-text-input");
    const currentCharactersText = playerDiv.querySelector(".characters-count");

    // Make sure it's a number
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


/**
 * Removes a player from the UI and updates sessionStorage
 * @param {Object} data - { username: string }
 */
function handlePlayerLeft(data) {
    const { username } = data;
    // Remove from DOM
    const playerDiv = document.getElementById(username);
    if (playerDiv && playerDiv.parentNode) {
        playerDiv.parentNode.removeChild(playerDiv);
    }

    // Remove from sessionStorage playersList
    let playersList = JSON.parse(sessionStorage.getItem("playersList") || "[]");
    playersList = playersList.filter(player => player.username !== username);
    sessionStorage.setItem("playersList", JSON.stringify(playersList));
}

// Extract room code from URL and start the game
const hashTag = window.location.hash.substring(1);
const [routeData, queryStr] = hashTag.split('?');
const hashParameters = new URLSearchParams(queryStr);
const room_id = hashParameters.get('id');
if (room_id) 
    startGame(room_id)