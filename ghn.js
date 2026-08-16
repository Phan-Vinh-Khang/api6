const https = require('https');
const zlib = require('zlib');

function forwardToGHN(headers) {
    return new Promise((resolve) => {
        // Loại bỏ các header không nên forward
        const filteredHeaders = { ...headers };
        delete filteredHeaders.host;
        delete filteredHeaders.connection;
        delete filteredHeaders['content-length'];
        delete filteredHeaders['content-encoding'];
        
        // Đảm bảo có accept
        if (!filteredHeaders.accept) {
            filteredHeaders.accept = 'application/json';
        }

        const options = {
            hostname: 'fe-online-gateway.ghn.vn',
            path: '/order-tracking/public-api/client/tracking-logs',
            method: 'GET',
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

        req.end();
    });
}

async function handleGHNRoutes(req, res) {
    try {
        if (req.method === 'GET' && req.url === '/ghn') {
            const result = await forwardToGHN(req.headers);

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