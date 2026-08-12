const express = require('express');
const cors = require('cors');
const https = require('https');
const zlib = require('zlib');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Bật CORS để React localhost:3000 có thể gọi được
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function requestWithCookie(cookie, voucherCode, accountIndex, voucherIndex) {
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
          return resolve({ accountIndex, voucherCode, success: false, error: 'decompress' });
        }

        try {
          const json = JSON.parse(data);
          resolve({ accountIndex, voucherCode, success: true, status: res.statusCode, data: json });
        } catch {
          resolve({ accountIndex, voucherCode, success: false, status: res.statusCode, raw: data.substring(0, 500) });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ accountIndex, voucherCode, success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

// ==================== API ENDPOINT ====================
app.post('/addVoucher_code', async (req, res) => {
  try {
    let { cookies, voucher_codes, delay_ms } = req.body;

    if (!cookies || !voucher_codes) {
      return res.status(400).json({ error: 'Thiếu cookies hoặc voucher_codes' });
    }

    // Nếu client gửi string (textarea), chuyển thành array
    if (typeof cookies === 'string') {
      cookies = cookies.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    }
    if (typeof voucher_codes === 'string') {
      voucher_codes = voucher_codes.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    }

    if (!Array.isArray(cookies) || !Array.isArray(voucher_codes)) {
      return res.status(400).json({ error: 'cookies và voucher_codes phải là array hoặc string đa dòng' });
    }

    const DELAY_MS = delay_ms || 100;
    const totalRequests = cookies.length * voucher_codes.length;
    const successList = [];
    const errorList = [];
    let requestCount = 0;

    console.log(`🚀 Bắt đầu: ${cookies.length} account x ${voucher_codes.length} voucher = ${totalRequests} request`);

    for (let i = 0; i < cookies.length; i++) {
      for (let j = 0; j < voucher_codes.length; j++) {
        requestCount++;
        const result = await requestWithCookie(cookies[i], voucher_codes[j], i, j);

        if (result.success && result.data?.data) {
          const invalidCode = result.data.data.invalid_message_code;
          if (invalidCode === 0 || invalidCode === 1) {
            successList.push({
              account: i + 1,
              voucher_code: voucher_codes[j],
              invalid_message_code: invalidCode,
              cookie: cookies[i],
              full_response: result.data
            });
          }
        } else if (!result.success) {
          errorList.push({
            account: i + 1,
            voucher_code: voucher_codes[j],
            error: result.error || 'Unknown error'
          });
        }

        if (requestCount < totalRequests) {
          await sleep(DELAY_MS);
        }
      }
    }

    // 💾 Lưu file JSON trên server
    const timestamp = Date.now();
    const filename = `valid_vouchers_${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(successList, null, 2));

    console.log(`🏁 Hoàn tất! ${successList.length} hợp lệ | ${errorList.length} lỗi`);

    return res.json({
      total_requests: totalRequests,
      valid_count: successList.length,
      error_count: errorList.length,
      valid_vouchers: successList,
      errors: errorList.slice(0, 20),
      saved_file: filename
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Shopee Voucher API Server đang chạy',
    endpoint: 'POST /addVoucher_code',
    body_format: { cookies: 'string\nstring', voucher_codes: 'string\nstring', delay_ms: 100 }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
  console.log(`📮 POST /addVoucher_code để thực thi`);
});
