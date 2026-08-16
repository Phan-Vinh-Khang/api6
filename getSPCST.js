const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');

function hashPassword(rawPassword) {
    const md5Hash = crypto.createHash('md5').update(rawPassword || '').digest('hex');
    return crypto.createHash('sha256').update(md5Hash).digest('hex');
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

function forwardToShopeeLogin(headers, postData) {
    return new Promise((resolve) => {
        const filteredHeaders = { ...headers };
        delete filteredHeaders.host;
        delete filteredHeaders.connection;
        delete filteredHeaders['content-length'];
        delete filteredHeaders['content-encoding'];

        filteredHeaders['content-type'] = 'application/json';
        filteredHeaders['content-length'] = Buffer.byteLength(postData);

        const options = {
            hostname: 'shopee.vn',
            path: '/api/v4/account/login_by_password',
            method: 'POST',
            headers: filteredHeaders
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
                    return resolve({
                        success: false,
                        error: 'decompress',
                        status: res.statusCode,
                        headers: res.headers
                    });
                }

                resolve({
                    success: true,
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });

        req.write(postData);
        req.end();
    });
}

async function handleGetSPCSTRoutes(req, res) {
    try {
        if (req.method === 'POST' && req.url === '/getSPCST') {
            const body = await parseBody(req);

            // Hash password trước khi gửi đến Shopee (MD5 → SHA256)
            if (body.password && typeof body.password === 'string') {
                body.password = hashPassword(body.password);
            }

            const postData = JSON.stringify(body);
            const result = await forwardToShopeeLogin(req.headers, postData);

            if (!result.success) {
                res.writeHead(502);
                res.end(JSON.stringify({ success: false, error: result.error }));
                return true;
            }

            const skipHeaders = ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive'];
            const forwardHeaders = {};
            for (const [key, value] of Object.entries(result.headers)) {
                if (!skipHeaders.includes(key.toLowerCase())) {
                    forwardHeaders[key] = value;
                }
            }

            if (!forwardHeaders['content-type'] && !forwardHeaders['Content-Type']) {
                forwardHeaders['Content-Type'] = 'application/json';
            }

            res.writeHead(result.status, forwardHeaders);
            res.end(result.data);
            return true;
        }
    } catch (err) {
        console.error('getSPCST route error:', err);
        if (!res.writableEnded) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return true;
    }

    return false;
}

module.exports = { handleGetSPCSTRoutes };