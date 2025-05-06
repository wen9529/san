// app.js 完整安全加固版
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');

// 初始化应用
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 安全防护配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// 脚本完整性校验
const scriptHashes = {
  'socket_handler.js': 'sha256-此处替换为实际哈希值',
  'card_renderer.js': 'sha256-此处替换为实际哈希值'
};

// 静态资源安全处理
app.use('/js/*', (req, res, next) => {
  const filename = path.basename(req.path);
  
  if (scriptHashes[filename]) {
    try {
      const fileContent = fs.readFileSync(path.join(__dirname, 'public/js', filename));
      const hash = crypto.createHash('sha256').update(fileContent).digest('base64');
      
      if (`sha256-${hash}` !== scriptHashes[filename]) {
        console.error(`文件篡改警报: ${filename}`);
        return res.status(403).send('Security verification failed');
      }
    } catch (err) {
      return res.status(404).send('Not found');
    }
  }
  next();
});

// 其他原有配置保持不变...
