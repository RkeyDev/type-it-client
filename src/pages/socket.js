let socket;
let reconnectDelay = 200;
let reconnecting = false;
let pendingResolvers = [];

function connect() {
    socket = new WebSocket("wss://type-it-backend.onrender.com");
    window.socket = socket;

    socket.onopen = () => {
        reconnectDelay = 200;
        reconnecting = false;
        if (pendingResolvers.length > 0) {
            const list = [...pendingResolvers];
            pendingResolvers = [];
            list.forEach(r => r.resolve());
        }
    };

    socket.onclose = () => {
        if (!reconnecting) reconnect();
    };

    socket.onerror = () => {
        socket.close();
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (pendingResolvers.length > 0) {
            const { resolve } = pendingResolvers.shift();
            resolve(data);
        }
        if (onServerMessage) onServerMessage(data);
    };
}

function reconnect() {
    reconnecting = true;
    setTimeout(() => {
        connect();
        reconnectDelay = Math.min(reconnectDelay + 200, 1000);
    }, reconnectDelay);
}

function getMessageFromServer() {
    return new Promise((resolve, reject) => {
        pendingResolvers.push({ resolve, reject });
    });
}

let onServerMessage = null;

connect();
