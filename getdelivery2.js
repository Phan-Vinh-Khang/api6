const https = require('https');
const zlib = require('zlib');

const requestBody = JSON.stringify({
  order_code: 'GYAGUPU4'
});

const options = {
  method: 'POST',
  hostname: 'fe-online-gateway.ghn.vn',
  path: '/order-tracking/public-api/client/tracking-logs',
  headers: {
    'accept': 'application/json',
    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    'content-length': Buffer.byteLength(requestBody)
  }
};

const req = https.request(options, (res) => {
  let chunks = [];

  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);

  res.on('data', (chunk) => chunks.push(chunk));

  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    let body = buffer;

    try {
      const encoding = res.headers['content-encoding'];

      if (encoding === 'gzip') {
        body = zlib.gunzipSync(buffer);
      } else if (encoding === 'deflate') {
        body = zlib.inflateSync(buffer);
      } else if (encoding === 'br') {
        body = zlib.brotliDecompressSync(buffer);
      }

      body = body.toString('utf8');

      const json = JSON.parse(body);
      console.log('Response JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (err) {
      console.error('Failed to parse JSON response:', err.message);
      console.log('Raw response:');
      console.log(buffer.toString('utf8'));
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.write(requestBody);
req.end();