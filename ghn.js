const https = require('https');
const zlib = require('zlib');

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

function forwardToGHN(headers, postData) {
    return new Promise((resolve) => {
        // Loại bỏ các header không nên forward
        const filteredHeaders = { ...headers };
        delete filteredHeaders.host;
        delete filteredHeaders.connection;
        delete filteredHeaders['content-length'];
        delete filteredHeaders['content-encoding'];

        // Đảm bảo content-type và content-length đúng
        filteredHeaders['content-type'] = 'application/json';
        filteredHeaders['content-length'] = Buffer.byteLength(postData);

        const options = {
            hostname: 'fe-online-gateway.ghn.vn',
            path: '/order-tracking/public-api/client/tracking-logs',
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

async function handleGHNRoutes(req, res) {
    try {
        if (req.method === 'POST' && req.url === '/ghn') {
            const body = await parseBody(req);
            const postData = JSON.stringify(body);
            const result = await forwardToGHN(req.headers, postData);

            if (!result.success) {
                res.writeHead(502);
                res.end(JSON.stringify({ success: false, error: result.error }));
                return true;
            }

            // Trả về data nguyên bản, không parse/chỉnh sửa
            res.writeHead(result.status, {
                'Content-Type': result.headers['content-type'] || 'application/json'
            });
            res.end(result.data);
            return true;
        }
    } catch (err) {
        console.error('GHN route error:', err);
        if (!res.writableEnded) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return true;
    }

    return false;
}

module.exports = { handleGHNRoutes };