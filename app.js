const http = require('http');
const { handleLoginRoutes, initDB, pool } = require('./loginFbody');
const { handleVoucherRoutes } = require('./addmggbody');

const PORT = process.env.PORT || 3003;

const server = http.createServer(async (req, res) => {
    // Global CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    try {
        const handledByLogin = await handleLoginRoutes(req, res);
        if (handledByLogin) return;

        const handledByVoucher = await handleVoucherRoutes(req, res);
        if (handledByVoucher) return;
    } catch (err) {
        console.error('Route handler error:', err);
        if (!res.writableEnded) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

initDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server ready at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Startup failed:', err.message);
        process.exit(1);
    });

process.on('SIGTERM', () => {
    pool.end();
    server.close(() => process.exit(0));
});

// Bắt lỗi không xử lý được để server không crash đột ngột
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});