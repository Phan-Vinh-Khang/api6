const https = require('https');
const zlib = require('zlib');

function forwardToShopeeOrder(headers) {
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
            hostname: 'chatbot.shopee.vn',
            path: '/api/v2/order_list?page_num=0&page_size=30&status=0&statusText=T%E1%BA%A5t+c%E1%BA%A3&user_type=1&query_type=0&is_seller=0',
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

async function handleGetOrderRoutes(req, res) {
    try {
        if (req.method === 'GET' && req.url === '/getOrder') {
            const result = await forwardToShopeeOrder(req.headers);

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
        console.error('GetOrder route error:', err);
        if (!res.writableEnded) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return true;
    }

    return false;
}

module.exports = { handleGetOrderRoutes };