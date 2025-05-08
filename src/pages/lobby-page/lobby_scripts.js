function copyRoomCode() {
    const roomCode = document.getElementById("room-code-button");

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