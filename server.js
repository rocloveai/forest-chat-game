const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

// 托管静态文件 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '.')));

// 存储所有在线玩家的数据
// 格式: { socketId: { x: 0, z: 0, id: 'socketId' } }
const players = {};

io.on('connection', (socket) => {
    console.log('新玩家连接:', socket.id);

    // 1. 初始化新玩家
    players[socket.id] = {
        id: socket.id,
        x: 0, // 初始 X
        z: 0, // 初始 Z
        color: Math.random() * 0xffffff // 随机分配一个颜色
    };

    // 2. 发送当前所有已存在的玩家给新加入者
    socket.emit('currentPlayers', players);

    // 3. 广播给其他玩家：有新人来了
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // 4. 监听：玩家移动
    socket.on('playerMove', (movementData) => {
        if (players[socket.id]) {
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

