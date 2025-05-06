const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// 设置静态文件目录
app.use(express.static("public"));

// 房间状态管理
const rooms = {};

// 生成一副扑克牌
function createDeck() {
  const suits = ["c", "d", "h", "s"];
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ code: rank + suit, rank: parseInt(rank) });
    }
  }
  return deck;
}

// 洗牌算法（Fisher-Yates）
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 发牌函数
function dealCards(room) {
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  const hands = [[], [], [], []];
  const players = Object.values(room.players);

  for (let i = 0; i < shuffledDeck.length; i++) {
    hands[i % 4].push(shuffledDeck[i]);
  }
  for (let i = 0; i < 4; i++) {
    room.players[players[i].id].hand = hands[i];
  }
}

// WebSocket 连接处理
io.on("connection", (socket) => {
  console.log("一个新的玩家连接：", socket.id);

  // 创建房间
  socket.on("create_room", (username) => {
    const roomId = "room-" + Math.random().toString(36).substring(2, 10); // 生成随机房间ID
    socket.join(roomId);
    rooms[roomId] = {
      players: {},
      gameStarted: false,
    };
    rooms[roomId].players[socket.id] = {
      id: socket.id,
      username,
      hand: [],
    };
    socket.emit("room_created", roomId);
    console.log(`房间 ${roomId} 创建成功，玩家 ${username} 加入`);
  });

  // 加入房间
  socket.on("join_room", (roomId, username) => {
    if (!rooms[roomId]) {
      socket.emit("room_not_found");
      return;
    }

    socket.join(roomId);
    rooms[roomId].players[socket.id] = {
      id: socket.id,
      username,
      hand: [],
    };
    // 广播给房间内的玩家
    io.to(roomId).emit("player_joined", Object.values(rooms[roomId].players).map(player => player.username));
    console.log(`玩家 ${username} 加入了房间 ${roomId}`);

    // 检查房间是否满4人，如果满4人则开始游戏
    if (Object.keys(rooms[roomId].players).length === 4) {
      dealCards(rooms[roomId]);
      io.to(roomId).emit("game_started");
      console.log(`房间 ${roomId} 开始游戏！`);
      for (const player of Object.values(rooms[roomId].players)){
        io.to(player.id).emit('your_hand', player.hand)
      }
    }
  });

  // 监听客户端发送的消息（示例）
  socket.on("playerAction", (actionData) => {
    console.log(`玩家 ${socket.id} 执行动作:`, actionData);
    // 根据 actionData 更新游戏状态
    // ... 游戏逻辑处理 ...

    // 广播游戏状态更新给所有客户端
    //io.emit('gameStateUpdate', gameState);
  });

  // 处理玩家断开连接
  socket.on("disconnect", () => {
    console.log("玩家断开连接：", socket.id);
    // 从房间中移除断开连接的玩家
    for (const roomId in rooms) {
        if (rooms[roomId].players[socket.id]) {
            delete rooms[roomId].players[socket.id];
        }
    }
    // 向所有客户端发送更新后的游戏状态
    //io.emit('gameStateUpdate', gameState);
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
