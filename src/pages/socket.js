const socket = new WebSocket("wss//respectable-crow-rkeydev-11f1364e.koyeb.app/");

//wss//respectable-crow-rkeydev-11f1364e.koyeb.app/
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