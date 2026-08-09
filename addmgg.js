const https = require('https');
const zlib = require('zlib');

// ✅ Cookie mới nhất (đã thêm AC_CERT_D)
const COOKIE = [
  'SPC_ST=RHg4Q3BhdlVoVk5EMzZyUUJrfYfajjjEGlLRYjaESg+hGE4r/fYKJOfZEuJ5byJcyVYRuQ4EvnksJZo8wh6sug8NX9zSFrt1p+kuaLiG5wjlz19AxHvWITW4N0ZRH+35xct6Zbo9lBTDG/u1UVfTNNgPZcu2cllO3Qymcy3ZrzAKI9L1yGLfWJe3NU2KGKi94mWk3xw067GuRTBrVUVXzQ==.AP6+UP59o9o6PCTG4mQC2yBJrYzj/yfQPttb01fTQBxL'
].join('; ');
const payload = {
  voucher_code: "BANMOISIEUHOIAUG1"
};

const postData = JSON.stringify(payload);

const options = {
  hostname: 'shopee.vn',
  path: '/api/v2/voucher_wallet/save_platform_voucher_by_voucher_code',
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'cookie': COOKIE,
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
      if (encoding === 'gzip') {
        data = zlib.gunzipSync(buffer).toString('utf8');
      } else if (encoding === 'deflate') {
        data = zlib.inflateSync(buffer).toString('utf8');
      } else if (encoding === 'br') {
        data = zlib.brotliDecompressSync(buffer).toString('utf8');
      }
    } catch (err) {
      console.error('\n❌ Lỗi giải nén response:');
      console.error(err.message);
      return;
    }

    console.log('\n📡 Status:', res.statusCode);
    console.log('📡 Content-Encoding:', res.headers['content-encoding']);

    try {
      const json = JSON.parse(data);
      console.log('\n✅ Response JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (err) {
      console.log('\n⚠️ Không phải JSON, raw data:');
      console.log(data.substring(0, 10000));
    }
  });
});

req.on('error', (err) => {
  console.error('\n❌ Request error:');
  console.error(err.message);
  process.exitCode = 1;
});

req.write(postData);
req.end();