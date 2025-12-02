// Network.js - 负责 Socket.io 通信
export class Network {
    constructor() {
        this.socket = null;
        this.myId = null;
        this.callbacks = {};
        this.init();
    }

    init() {
        try {
            this.socket = io();
            this.socket.on('connect', () => {
                this.myId = this.socket.id;
                console.log('Socket Connected ID:', this.myId);
                if (this.callbacks.onConnect) this.callbacks.onConnect(this.myId);
            });
        } catch(e) {
            console.error('Socket 连接失败', e);
        }
    }

    on(event, callback) {
        if (!this.socket) return;
        this.socket.on(event, callback);
    }

    emit(event, data) {
        if (!this.socket || !this.socket.connected) return;
        this.socket.emit(event, data);
    }

    setCallback(name, callback) {
        this.callbacks[name] = callback;
    }
}
