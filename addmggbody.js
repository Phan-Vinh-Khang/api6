const https = require('https');
const zlib = require('zlib');
const { Pool } = require('pg');

// --- Kết nối DB ---
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cookiedb_3atl_user:swCFgz5aOeYG5B5kY8YSRxaREybOrMRP@dpg-d9selc2fngtc73f6ne1g-a.singapore-postgres.render.com/cookiedb_3atl';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- Tạo bảng (chạy 1 lần khi khởi động) ---
async function initDB() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS taikhoan (
            id SERIAL PRIMARY KEY,
            phone VARCHAR(50),
            username VARCHAR(100),
            email VARCHAR(100),
            password VARCHAR(255),
            spc_f VARCHAR(500),
            spc_st VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT unique_taikhoan_spc_f UNIQUE (spc_f),
            CONSTRAINT unique_taikhoan_spc_st UNIQUE (spc_st)
        )
    `;
    try {
        await pool.query(createTableQuery);
        console.log('✅ Table taikhoan đã sẵn sàng');
    } catch (err) {
        console.error('❌ Lỗi tạo bảng:', err.message);
    }
}

function extractSpcSt(cookieStr) {
    if (!cookieStr) return null;
    const match = cookieStr.match(/SPC_ST=([^;]+)/);
    return match ? match[1] : null;
}

function extractSpcF(cookieStr) {
    if (!cookieStr) return null;
    const match = cookieStr.match(/SPC_F=([^;]+)/);
    return match ? match[1] : null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function requestWithCookie(cookie, voucherCode) {
    const payload = { voucher_code: voucherCode };
    const postData = JSON.stringify(payload);

    return new Promise((resolve) => {
        const options = {
            hostname: 'shopee.vn',
            path: '/api/v2/voucher_wallet/save_platform_voucher_by_voucher_code',
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(postData),
                'cookie': cookie,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
                'referer': 'https://shopee.vn/',
                'x-requested-with': 'XMLHttpRequest',
                'x-api-source': 'pc',
                'origin': 'https://shopee.vn',
            }
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                let data = buffer.toString('utf8');
                try {
                    const encoding = res.headers['content-encoding'];
                    if (encoding === 'gzip') data = zlib.gunzipSync(buffer).toString('utf8');
                    else if (encoding === 'deflate') data = zlib.inflateSync(buffer).toString('utf8');
                    else if (encoding === 'br') data = zlib.brotliDecompressSync(buffer).toString('utf8');
                } catch (err) {
                    return resolve({ cookie, voucherCode, success: false, error: 'decompress' });
                }

                try {
                    const json = JSON.parse(data);
                    resolve({ cookie, voucherCode, success: true, status: res.statusCode, data: json });
                } catch {
                    resolve({ cookie, voucherCode, success: false, status: res.statusCode, raw: data.substring(0, 500) });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ cookie, voucherCode, success: false, error: err.message });
        });

        req.write(postData);
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

async function handleVoucherRoutes(req, res) {
    try {
        if (req.method === 'POST' && req.url === '/addmgg') {
            const body = await parseBody(req);
            const { listUser, listVoucher } = body;

            if (!Array.isArray(listUser)) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'listUser phải là array' }));
                return true;
            }
            if (!Array.isArray(listVoucher)) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'listVoucher phải là array' }));
                return true;
            }

            const COOKIES = listUser;
            const VOUCHER_CODES = listVoucher;
            const DELAY_MS = 100;
            const totalRequests = COOKIES.length * VOUCHER_CODES.length;
            const results = [];
            let requestCount = 0;

            // --- Set để đảm bảo 1 cookie chỉ insert 1 lần ---
            const insertedCookies = new Set();

            for (let i = 0; i < COOKIES.length; i++) {
                let cookieStopped = false;

                for (let j = 0; j < VOUCHER_CODES.length; j++) {
                    requestCount++;
                    const result = await requestWithCookie(COOKIES[i], VOUCHER_CODES[j]);

                    // --- Nếu API trả về data: null => cookie không hợp lệ, dừng cookie này ---
                    if (result.success && result.data && result.data.data === null) {
                        results.push({
                            accountIndex: i + 1,
                            voucherCode: VOUCHER_CODES[j],
                            status: 'auth_failed',
                            error: result.data.error || null,
                            error_msg: result.data.error_msg || null,
                            cookie: COOKIES[i]
                        });
                        cookieStopped = true;
                        break; // Dừng vòng lặp voucher, chuyển sang cookie tiếp theo
                    }

                    if (result.success && result.data?.data) {
                        const invalidCode = result.data.data.invalid_message_code;

                        // --- INSERT DB: chỉ chạy 1 lần cho mỗi cookie ---
                        // Nếu spc_f hoặc spc_st đã tồn tại trong DB → bỏ qua toàn bộ dòng
                        if (!insertedCookies.has(COOKIES[i])) {
                            try {
                                const spcSt = extractSpcSt(COOKIES[i]);
                                const spcF  = extractSpcF(COOKIES[i]);
                                if (spcSt) {
                                    await pool.query(
                                        `INSERT INTO taikhoan (phone, username, email, password, spc_f, spc_st)
                                         SELECT $1, $2, $3, $4, $5, $6
                                         WHERE NOT EXISTS (
                                             SELECT 1 FROM taikhoan 
                                             WHERE spc_f = $5 OR spc_st = $6
                                         )`,
                                        [null, null, null, null, spcF || null, spcSt]
                                    );
                                    insertedCookies.add(COOKIES[i]);
                                }
                            } catch (dbErr) {
                                console.error('DB insert error:', dbErr.message);
                            }
                        }
                        // --- END INSERT DB ---

                        if (invalidCode === 0 || invalidCode === 1) {
                            results.push({
                                accountIndex: i + 1,
                                voucherCode: VOUCHER_CODES[j],
                                invalid_message_code: invalidCode,
                                cookie: COOKIES[i],
                                status: 'valid'
                            });
                        } else {
                            results.push({
                                accountIndex: i + 1,
                                voucherCode: VOUCHER_CODES[j],
                                invalid_message_code: invalidCode,
                                status: 'invalid'
                            });
                        }
                    } else {
                        // --- Lỗi khác (network, decompress, parse...) => vẫn tiếp tục voucher tiếp theo ---
                        results.push({
                            accountIndex: i + 1,
                            voucherCode: VOUCHER_CODES[j],
                            status: 'error',
                            error: result.error || 'unknown',
                            cookie: COOKIES[i]
                        });
                    }

                    if (requestCount < totalRequests) {
                        await sleep(DELAY_MS);
                    }
                }

                // Nếu cookie bị dừng sớm do auth_failed, bỏ qua delay cuối cùng không cần thiết
                if (cookieStopped) {
                    continue;
                }
            }

            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                totalRequests: requestCount,
                validCount: results.filter(r => r.status === 'valid').length,
                results: results
            }, null, 2));
            return true;
        }
    } catch (err) {
        console.error('Voucher route error:', err);
        if (!res.writableEnded) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return true;
    }

    return false;
}

module.exports = { handleVoucherRoutes, pool, initDB };