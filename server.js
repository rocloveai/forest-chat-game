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

// 存储咬住状态
// 格式: { cabbageId: { animalId: 'socketId', timer: 2.0 } }
const catchStates = {};

io.on('connection', (socket) => {
    console.log('新玩家连接:', socket.id);

    // 1. 初始化新玩家 (连接时只给 ID，不给坐标，等 joinGame 再给)
    players[socket.id] = {
        id: socket.id,
        x: 0, 
        y: 0.5, // 初始 Y 坐标（地面高度）
        z: 0,
        color: Math.random() * 0xffffff,
        name: "Player",
        modelType: "robot",
        isJoined: false, // 标记是否已进入游戏
        isCaught: false, // 是否被咬住（卷心菜）
        caughtBy: null, // 被谁咬住
        isEating: false, // 是否在吃菜（动物）
        eatingTarget: null // 正在吃哪个玩家
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
            // 如果玩家被咬住（卷心菜），不允许移动
            if (players[socket.id].isCaught) {
                return; // 忽略移动请求
            }
            
            players[socket.id].x = movementData.x;
            players[socket.id].z = movementData.z;
            // 更新 Y 坐标（用于同步跳跃）
            if (movementData.y !== undefined && movementData.y !== null) {
                players[socket.id].y = movementData.y;
            }
            // 广播给其他人（包括 Y 坐标）
            socket.broadcast.emit('playerMoved', {
                id: players[socket.id].id,
                x: players[socket.id].x,
                y: players[socket.id].y,
                z: players[socket.id].z
            });
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

    // 6. 咬住卷心菜
    socket.on('catchCabbage', (data) => {
        const { animalId, cabbageId } = data;
        const actualAnimalId = socket.id; // 发送者的ID
        
        // 验证：发送者必须是动物，目标必须是卷心菜
        if (players[actualAnimalId] && players[cabbageId] && 
            players[actualAnimalId].modelType !== 'cabbage' &&
            players[cabbageId].modelType === 'cabbage' &&
            !players[cabbageId].isCaught) { // 卷心菜没有被咬住
            
            // 设置咬住状态
            players[cabbageId].isCaught = true;
            players[cabbageId].caughtBy = actualAnimalId;
            players[actualAnimalId].isEating = true;
            players[actualAnimalId].eatingTarget = cabbageId;
            
            catchStates[cabbageId] = {
                animalId: actualAnimalId,
                timer: 2.0
            };
            
            // 广播给所有人
            io.emit('cabbageCaught', {
                animalId: actualAnimalId,
                cabbageId: cabbageId
            });
            
            console.log(`玩家 ${actualAnimalId} 咬住了卷心菜 ${cabbageId}`);
            
            // 2秒后自动释放
            setTimeout(() => {
                if (catchStates[cabbageId] && catchStates[cabbageId].animalId === actualAnimalId) {
                    // 释放
                    players[cabbageId].isCaught = false;
                    players[cabbageId].caughtBy = null;
                    players[actualAnimalId].isEating = false;
                    players[actualAnimalId].eatingTarget = null;
                    delete catchStates[cabbageId];
                    
                    // 广播释放
                    io.emit('cabbageReleased', {
                        animalId: actualAnimalId,
                        cabbageId: cabbageId
                    });
                    
                    console.log(`卷心菜 ${cabbageId} 被释放`);
                }
            }, 2000);
        }
    });
    
    // 7. 释放卷心菜（提前释放，虽然主要是自动释放）
    socket.on('releaseCabbage', (data) => {
        const { animalId, cabbageId } = data;
        const actualAnimalId = socket.id;
        
        if (catchStates[cabbageId] && catchStates[cabbageId].animalId === actualAnimalId) {
            players[cabbageId].isCaught = false;
            players[cabbageId].caughtBy = null;
            players[actualAnimalId].isEating = false;
            players[actualAnimalId].eatingTarget = null;
            delete catchStates[cabbageId];
            
            io.emit('cabbageReleased', {
                animalId: actualAnimalId,
                cabbageId: cabbageId
            });
        }
    });

    // 8. 断开连接
    socket.on('disconnect', () => {
        console.log('玩家断开:', socket.id);
        
        // 清理咬住状态
        if (catchStates[socket.id]) {
            const animalId = catchStates[socket.id].animalId;
            if (players[animalId]) {
                players[animalId].isEating = false;
                players[animalId].eatingTarget = null;
            }
            delete catchStates[socket.id];
        }
        
        // 清理被咬住状态
        for (const [cabbageId, state] of Object.entries(catchStates)) {
            if (state.animalId === socket.id) {
                if (players[cabbageId]) {
                    players[cabbageId].isCaught = false;
                    players[cabbageId].caughtBy = null;
                }
                delete catchStates[cabbageId];
            }
        }
        
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`多人联机服务器运行中: http://localhost:${PORT}`);
});

