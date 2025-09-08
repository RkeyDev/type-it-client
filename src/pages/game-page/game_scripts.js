/**
 * Handles incoming socket messages and updates game accordingly.
 */
socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("Received data:", data);

        switch (data.type) {
            case "game_started":
                initializeGame(); // Show countdown only
                break;
            case "start_new_round":
                startNewRound(data.data.question); // Display the round
                break;
            case "player_guessed_incorrectly":
                handleIncorrectGuess(data.data);
                break;
            case "player_guessed_correctly":
                handleCorrectGuess(data.data);
                break;
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

    // Remove waiting text if present
    if (gameWaitingText) {
        center.removeChild(gameWaitingText);
    }

    // Run visual countdown before first round
    startCountdown(center, () => {
        console.log("Countdown finished, waiting for server to start the round...");
    });
}

/**
 * Displays a countdown (5 → 0) in the given container
 * Calls onFinish when done
 */
function startCountdown(container, onFinish) {
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

/**
 * Starts a new round by displaying the question in a textarea
 */
function startNewRound(question) {
    const timeToType = 60; // seconds to type
    
    const center = document.querySelector(".center");
    const timeLeftLabel = document.getElementById("time-left");

    if (timeLeftLabel) timeLeftLabel.textContent = timeToType;

    // Create textarea for user input
    const userTextInput = document.createElement("textarea");
    userTextInput.id = "user-text-input";
    userTextInput.placeholder = question; // Use question from server
    userTextInput.value = "";

    // Clear previous content and append new textarea
    center.innerHTML = "";
    center.appendChild(userTextInput);

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


function handleIncorrectGuess(data) {
    const userTextInput = document.getElementById("user-text-input");
    const oldPlaceholder = userTextInput.placeholder;

    userTextInput.placeholder = "incorrect word";
    userTextInput.classList.add("error");
    userTextInput.disabled = true;

    setTimeout(() => {
        userTextInput.placeholder = oldPlaceholder;
        userTextInput.classList.remove("error");
        userTextInput.disabled = false;
    }, 1000);
}


function handleCorrectGuess(data) {

    if(data.playerName === sessionStorage.getItem("username")){ // Notify user of their correct guess
        const userTextInput = document.getElementById("user-text-input");
        const currentCharactersText = document.getElementById("current-characters");

        userTextInput.placeholder = "correct word!";
        userTextInput.classList.add("correct");
        userTextInput.disabled = true;
        currentCharactersText.textContent = data.currentTotalCharacters;


    }else{ // Notify user that someone else guessed correctly
        
    }
}

// Extract room code from URL and start the game
const hashTag = window.location.hash.substring(1);
const [routeData, queryStr] = hashTag.split('?');
const hashParameters = new URLSearchParams(queryStr);
const room_id = hashParameters.get('id');
if (room_id) 
    startGame(room_id)

