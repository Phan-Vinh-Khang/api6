const http = require('http');
const https = require('https');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;

// Hàm hash password theo logic Shopee
function hashPassword(rawPassword) {
    const md5Hash = crypto.createHash('md5').update(rawPassword).digest('hex');
    return crypto.createHash('sha256').update(md5Hash).digest('hex');
}

// Hàm gọi API Shopee
function loginShopee(phone, rawPassword) {
    return new Promise((resolve, reject) => {
        const passwordHash = hashPassword(rawPassword);

        const payload = {
            client_identifier: {
                security_device_fingerprint: 'test9'
            },
            password: passwordHash,
            stay_logged_in: true,
            support_ivs: true,
            phone: phone
        };

        const data = JSON.stringify(payload);

        const options = {
            hostname: 'shopee.vn',
            path: '/api/v4/account/login_by_password',
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'accept-language': 'vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(data, 'utf8'),
                'cookie': 'SPC_F=I7kYsQ53aJZE0tJvNI64FzvNh8P1V41N',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0'
            }
        };

        const req = https.request(options, (res) => {
            let spcSt = null;
            const setCookie = res.headers['set-cookie'];

            if (Array.isArray(setCookie)) {
                const cookie = setCookie.find(c => c.trim().startsWith('SPC_ST='));
                if (cookie) spcSt = cookie.split(';')[0].replace('SPC_ST=', '');
            } else if (typeof setCookie === 'string' && setCookie.trim().startsWith('SPC_ST=')) {
                spcSt = setCookie.split(';')[0].replace('SPC_ST=', '');
            }

            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                let parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                } catch {
                    parsedBody = { raw: body };
                }

                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    spcSt: spcSt,
                    shopeeResponse: parsedBody
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

// Parse JSON body từ request
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(new Error('Invalid JSON body'));
            }
        });
    });
}

// Tạo server
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Endpoint login
    if (req.method === 'POST' && req.url === '/login') {
        try {
            const body = await parseBody(req);
            const { phone, password } = body;

            if (!phone || !password) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Thiếu phone hoặc password trong body'
                }));
                return;
            }

            console.log(`[${new Date().toISOString()}] Login request: phone=${phone}`);

            const result = await loginShopee(phone, password);

            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                spcSt: result.spcSt,
                shopeeStatus: result.statusCode,
                shopeeResponse: result.shopeeResponse
            }, null, 2));

        } catch (err) {
            console.error('Error:', err.message);
            res.writeHead(500);
            res.end(JSON.stringify({
                success: false,
                error: err.message
            }));
        }
        return;
    }

    // Health check
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
        return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📌 POST /login    - Đăng nhập (body: {phone, password})`);
    console.log(`📌 GET  /health   - Kiểm tra server`);
});

// Xử lý graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    server.close(() => process.exit(0));
});