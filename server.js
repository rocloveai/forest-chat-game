const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

// 托管静态文件 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 确保根路径返回 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 存储所有在线玩家的数据
// 格式: { socketId: { x: 0, z: 0, id: 'socketId' } }
const players = {};

io.on('connection', (socket) => {
    console.log('新玩家连接:', socket.id);

    // 1. 初始化新玩家 (连接时只给 ID，不给坐标，等 joinGame 再给)
    players[socket.id] = {
        id: socket.id,
        x: 0, 
        z: 0,
        color: Math.random() * 0xffffff,
        name: "Player",
        modelType: "robot",
        isJoined: false // 标记是否已进入游戏
    };

    // 2. 发送当前所有 *已加入游戏* 的玩家给新连接者
    // (过滤掉那些还在登录界面的)
    const joinedPlayers = {};
    Object.keys(players).forEach(id => {
        if(players[id].isJoined) joinedPlayers[id] = players[id];
    });
    socket.emit('currentPlayers', joinedPlayers);

    // 注意：不再这里自动广播 newPlayer，而是等 joinGame 事件触发时才广播

    // --- 监听：玩家点击开始游戏 ---
    socket.on('joinGame', (data) => {
        console.log(`玩家 ${socket.id} 加入游戏: ${data.name}`);
        if (players[socket.id]) {
            players[socket.id].name = data.name || "Unknown";
            players[socket.id].modelType = data.type || "robot";
            players[socket.id].isJoined = true;
            // 随机一个出生点
            players[socket.id].x = (Math.random() - 0.5) * 10;
            players[socket.id].z = (Math.random() - 0.5) * 10;

            // 关键修正：告诉所有人（包括自己）：有一个新玩家生成了
            io.emit('newPlayer', players[socket.id]);
        }
    });

    // 4. 监听：玩家移动
    socket.on('playerMove', (movementData) => {
        if (players[socket.id] && players[socket.id].isJoined) {
            players[socket.id].x = movementData.x;
            players[socket.id].z = movementData.z;
            // 广播给其他人
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // 5. 监听：聊天
    socket.on('chatMessage', (msg) => {
        // 广播给所有人 (包括自己)
        io.emit('chatMessage', {
            id: socket.id,
            text: msg
        });
    });

    // 6. 断开连接
    socket.on('disconnect', () => {
        console.log('玩家断开:', socket.id);
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`多人联机服务器运行中: http://localhost:${PORT}`);
});

