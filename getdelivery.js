const https = require('https');
const zlib = require('zlib');

const requestBody = JSON.stringify({
  tracking_id: 'SPXVN069115930167'
});

const options = {
  method: 'POST',
  hostname: 'tramavandon.com',
  path: '/api/spx.php'
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
