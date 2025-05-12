import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import https from 'https';
import morgan from 'morgan'; // 用于日志记录

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 添加请求日志中间件
app.use(morgan('combined'));

// 配置代理选项
const createProxyConfig = (targetUrl) => ({
  target: targetUrl,
  changeOrigin: true,
  secure: false, // 不验证SSL证书
  logLevel: 'debug',
  agent: new https.Agent({
    rejectUnauthorized: false // 忽略证书验证错误
  }),
  onProxyReq: (proxyReq, req, res) => {
    // 在这里可以修改请求头
    console.log(`代理请求到: ${req.method} ${targetUrl}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // 添加CORS头，允许跨域访问
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    console.log(`收到来自目标服务器的响应: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('代理错误:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(`代理请求时发生错误: ${err.message}`);
  }
});

// 支持多个目标站点的配置
const proxyRoutes = [
  {
    path: '/',
    config: {
      target: 'https://subscription-gov.lianjiasub.work'
    }
  }
];

// 为每个路径配置代理
proxyRoutes.forEach(({ path, config }) => {
  const proxyOptions = {
    ...createProxyConfig(config.target),
    pathRewrite: config.pathRewrite
  };

  app.use(path, createProxyMiddleware(proxyOptions));
  console.log(`配置代理路径: ${path} -> ${config.target}`);
});

// 添加CORS预检请求处理
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`代理服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log('所有SSL证书验证已禁用');
});