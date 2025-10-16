const socket = new WebSocket("wss://type-it-backend.onrender.com");

//wss://type-it-backend.onrender.com
//ws://localhost:8080

window.socket = socket;

function getMessageFromServer() {
    return new Promise((resolve, reject) => {
        const handler = (event) => {
            try {
                const data = JSON.parse(event.data);
                resolve(data);
                socket.removeEventListener("message", handler); // clean up after receiving
            } catch (e) {
                reject(e);
            }
        };

        socket.addEventListener("message", handler);
    });
}