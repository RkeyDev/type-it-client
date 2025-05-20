const room_code_textfield = document.getElementById("room-code-textfield");

//Get session storage data
const username = window.sessionStorage.getItem('username');
const skin = window.sessionStorage.getItem('skin');

document.getElementById("create-room-button").addEventListener("click", createRoom);



function joinRoom(){

    if(!(room_code_textfield.value.length > 15) && !(room_code_textfield.value.length == 0)){
        handleRoomJoin(); // Call the function to handle form submission
    }
}

async function handleRoomJoin(){
    const room_code = room_code_textfield.value;

    const request = {
        type: "player_join",
        username: username,
        skin: skin,
        room_code: room_code,
        is_host: "false"
    }

    if(sendSessionStorageData(request)){
        const connection_status = await getMessageFromServer();
        if (connection_status.type == "connection_status" && connection_status.status == "connected")
            // Redirect to the lobby page with the room ID
            document.location.hash = `#lobby?id=${room_code}`; 
    }
    
}


async function createRoom(){
    try{
        
        const room_code = await getRoomCode();
        if(room_code == null){
            throw new Error("Failed to get room code from server.");
        }
        
        // Create the data object to send to the server
        const request = {
            type: "room_creation",
            room_code: room_code,
            players: [{
                username: username,
                skin: skin,
                room_code: room_code,
                is_host: "true"
            }]
        };

            if(sendSessionStorageData(request)){
                // Redirect to the lobby page with the room ID
                document.location.hash = `#lobby?id=${room_code}`; 
            }
        

        socket.addEventListener("error", (err) => {
            console.error("WebSocket error:", err);
        });
        
        }catch(err){
            console.error("error:", err);
        }
}


async function getRoomCode() {
    const request = {
        "type":"get_room_code"
    }
    sendSessionStorageData(request);
    const data = await getMessageFromServer()
    if(data.type == "room_code"){
        try{
            return data.room_code;
        }
        catch(e){
            throw e;
        }
    }

    return null;

}


function sendSessionStorageData(data){
    // Send the data to the server
    // The data should be in JSON format
    try{
        if(socket.readyState == WebSocket.OPEN){
            socket.send(JSON.stringify(data));
            return true;
        }
    }
    catch (e)
    {
        console.log(e);
    }
    return false;
    
}