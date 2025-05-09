let room_code_textfield = document.getElementById("room-code-textfield");


function joinRoom(){

    if(!(room_code_textfield.value.length > 15) && !(room_code_textfield.value.length == 0)){
        handleRoomJoin(); // Call the function to handle form submission
    }
}

function handleRoomJoin(){
    alert("Function not implemented yet");
}



function createRoom(){
    try{
        const socket = new WebSocket("ws://localhost:8080");

        //Get session storage data
        const username = window.sessionStorage.getItem('username');
        const skin = window.sessionStorage.getItem('skin');

        //Create the data object to send to the server
        const data = {
            type: "user_join",
            username: username,
            skin: skin
        };

        
        socket.addEventListener("open", () => {
            sendSessionStorageData(socket,data);

            // Redirect to the lobby page with the room ID
            document.location.hash = `#lobby?id=${12345678}`; // TODO Replace with the actual room ID
        });

        socket.addEventListener("error", (err) => {
            console.error("WebSocket error:", err);
        });
    }catch(err){
        console.error("error:", err);
    }
}

function sendSessionStorageData(socket,data){
    // Send the data to the server
    // The data should be in JSON format
    socket.send(JSON.stringify(data));

    
}