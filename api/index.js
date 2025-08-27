const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'ThunderTrack Frame API is working!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Frame HTML页面
app.get('/api/frame/diary', (req, res) => {
  const { pair = 'Unknown', pnl = '0', strategy = 'Unknown', sentiment = 'Unknown' } = req.query;
  
  // 构建Mini App embed JSON - 跳转到具体日记详情页
  const diaryId = req.query.id || `${pair}-${Date.now()}`; // 生成或使用传入的日记ID
  const miniAppEmbed = {
    version: "1",
    imageUrl: `${req.protocol}://${req.get('host')}/api/frame/image?pair=${encodeURIComponent(pair)}&pnl=${pnl}&strategy=${encodeURIComponent(strategy)}&sentiment=${encodeURIComponent(sentiment)}`,
    button: {
      title: "查看详情",
      action: {
        type: "launch_miniapp",
        // 确保使用正确的Mini App URL，不包含子路径
        url: "https://thundertrack-miniapp.vercel.app",
        // 通过postMessage传递参数而不是URL参数
        name: "ThunderTrack",
        splashImageUrl: "https://thundertrack-miniapp.vercel.app/icons/Icon-192.png",
        splashBackgroundColor: "#1a1a2e"
      }
    },
    // 添加数据传递
    metadata: {
      diaryId: diaryId,
      pair: pair,
      pnl: pnl,
      strategy: strategy,
      sentiment: sentiment
    }
  };
  
  const miniAppEmbedString = JSON.stringify(miniAppEmbed);
  
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ThunderTrack 交易复盘 - ${pair}</title>
    
    <!-- Mini App embed meta tags -->
    <meta name="fc:miniapp" content='${miniAppEmbedString}' />
    <!-- For backward compatibility -->
    <meta name="fc:frame" content='${miniAppEmbedString}' />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="ThunderTrack 交易复盘 - ${pair}" />
    <meta property="og:description" content="交易对: ${pair} | 盈亏: ${pnl >= 0 ? '+' : ''}$${pnl} | 策略: ${strategy}" />
    <meta property="og:image" content="${req.protocol}://${req.get('host')}/api/frame/image?pair=${encodeURIComponent(pair)}&pnl=${pnl}&strategy=${encodeURIComponent(strategy)}&sentiment=${encodeURIComponent(sentiment)}" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}/api/frame/diary" />
    <meta property="og:type" content="website" />
</head>
<body>
    <!-- Frame被Farcaster客户端处理，不显示页面内容 -->
    <script>
        // 如果是直接访问这个URL，重定向到Mini App
        if (window.location.href.includes('/api/frame/diary')) {
            // 构建Mini App URL with parameters
            const urlParams = new URLSearchParams(window.location.search);
            const diaryId = urlParams.get('id') || '${diaryId}';
            const miniAppUrl = \`https://thundertrack-miniapp.vercel.app/#/diary/\${diaryId}?\${urlParams.toString()}\`;
            
            console.log('🔗 重定向到Mini App:', miniAppUrl);
            window.location.href = miniAppUrl;
        }
    </script>
    
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; text-align: center;">
        <h2>🔄 正在重定向到ThunderTrack Mini App...</h2>
        <p>如果没有自动跳转，请 <a href="https://thundertrack-miniapp.vercel.app" target="_blank">点击这里</a></p>
    </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Frame图片API
app.get('/api/frame/image', (req, res) => {
  const { pair = 'Unknown', pnl = '0', strategy = 'Unknown', sentiment = 'Unknown' } = req.query;
  const pnlValue = parseFloat(pnl) || 0;
  
  const svg = `<svg width="600" height="315" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="50%" style="stop-color:#16213e"/>
        <stop offset="100%" style="stop-color:#0f0f23"/>
      </linearGradient>
      <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#00ff88"/>
        <stop offset="100%" style="stop-color:#00d4aa"/>
      </linearGradient>
    </defs>
    
    <rect width="600" height="315" fill="url(#bg)" rx="15"/>
    <rect x="0" y="0" width="600" height="60" fill="rgba(0,255,136,0.1)" rx="15"/>
    
    <text x="300" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#neon)" text-anchor="middle">
      🔥 ThunderTrack 交易复盘
    </text>
    
    <rect x="30" y="80" width="540" height="180" fill="rgba(255,255,255,0.05)" rx="10" stroke="rgba(0,255,136,0.3)" stroke-width="1"/>
    
    <text x="50" y="110" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">📊 交易对:</text>
    <text x="450" y="110" font-family="Arial, sans-serif" font-size="18" fill="url(#neon)" font-weight="bold" text-anchor="end">${pair}</text>
    
    <text x="50" y="145" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">💰 盈亏:</text>
    <text x="450" y="145" font-family="Arial, sans-serif" font-size="20" fill="${pnlValue >= 0 ? '#00ff88' : '#ff4757'}" font-weight="bold" text-anchor="end">${pnlValue >= 0 ? '+' : ''}$${pnlValue.toFixed(2)}</text>
    
    <text x="50" y="180" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">🎯 策略:</text>
    <text x="450" y="180" font-family="Arial, sans-serif" font-size="16" fill="#cccccc" text-anchor="end">${strategy}</text>
    
    <text x="50" y="215" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">😊 心情:</text>
    <text x="450" y="215" font-family="Arial, sans-serif" font-size="16" fill="#cccccc" text-anchor="end">${sentiment}</text>
    
    <line x1="50" y1="240" x2="550" y2="240" stroke="rgba(0,255,136,0.3)" stroke-width="1"/>
    <text x="300" y="280" font-family="Arial, sans-serif" font-size="14" fill="rgba(0,255,136,0.8)" text-anchor="middle">#ThunderTrack #TTrade</text>
  </svg>`;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'ThunderTrack Frame API',
    version: '1.0.0',
    endpoints: [
      '/api/test',
      '/api/frame/diary',
      '/api/frame/image'
    ]
  });
});

app.listen(port, () => {
  console.log(`ThunderTrack Frame API running on port ${port}`);
});