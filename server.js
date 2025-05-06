const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// 设置静态文件目录
app.use(express.static('public'));

// 基本的游戏状态（示例）
let gameState = {
    players: [],
    currentTurn: 0,
    // ... 其他游戏状态 ...
};

// WebSocket 连接处理
io.on('connection', (socket) => {
    console.log('一个新的玩家连接：', socket.id);

    // 添加新玩家到游戏状态
    gameState.players.push({
        id: socket.id,
        // ... 其他玩家信息 ...
    });

    // 向所有客户端发送更新后的游戏状态
    io.emit('gameStateUpdate', gameState);

    // 监听客户端发送的消息（示例）
    socket.on('playerAction', (actionData) => {
        console.log(`玩家 ${socket.id} 执行动作:`, actionData);
        // 根据 actionData 更新游戏状态
        // ... 游戏逻辑处理 ...

        // 广播游戏状态更新给所有客户端
        io.emit('gameStateUpdate', gameState);
    });

    // 处理玩家断开连接
    socket.on('disconnect', () => {
        console.log('玩家断开连接：', socket.id);
        // 从游戏状态中移除断开连接的玩家
        gameState.players = gameState.players.filter(player => player.id !== socket.id);
        // 向所有客户端发送更新后的游戏状态
        io.emit('gameStateUpdate', gameState);
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});