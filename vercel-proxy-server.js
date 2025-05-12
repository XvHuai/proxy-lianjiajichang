import http from 'http'
import https from 'https'
import httpProxy from 'http-proxy'
// 创建代理服务器
const proxy = httpProxy.createProxyServer({
    // 忽略 HTTPS 证书错误
    secure: false,
    changeOrigin: true,
    agent: https.globalAgent,
    proxyTimeout: 30000,
    timeout: 30000
});

const TARGET = 'https://subscription-gov.lianjiasub.work';

const server = http.createServer((req, res) => {
    console.log(`Proxying request to: ${TARGET}${req.url}`);

    // 错误处理
    proxy.on('error', (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });
        res.end('Proxy error');
    });

    // 代理请求
    proxy.web(req, res, {
        target: TARGET
    });
});

// 设置监听端口
const PORT = process.env.PORT || 3242;
server.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});

// 优雅退出
process.on('SIGINT', () => {
    console.log('Shutting down proxy server...');
    server.close(() => {
        console.log('Proxy server closed');
        process.exit(0);
    });
});
