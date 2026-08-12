const https = require('https');
const zlib = require('zlib');

// ✅ Danh sách cookie (mỗi phần tử là 1 account)
const COOKIES = [
  'SPC_ST=RHg4Q3BhdlVoVk5EMzZyUUJrfYfajjjEGlLRYjaESg+hGE4r/fYKJOfZEuJ5byJcyVYRuQ4EvnksJZo8wh6sug8NX9zSFrt1p+kuaLiG5wjlz19AxHvWITW4N0ZRH+35xct6Zbo9lBTDG/u1UVfTNNgPZcu2cllO3Qymcy3ZrzAKI9L1yGLfWJe3NU2KGKi94mWk3xw067GuRTBrVUVXzQ==.AP6+UP59o9o6PCTG4mQC2yBJrYzj/yfQPttb01fTQBxL',
  // 'SPC_ST=...cookie_account_2...',
  // 'SPC_ST=...cookie_account_3...',
];

// ✅ Danh sách voucher cần lưu
const VOUCHER_CODES = [
  "BANMOISIEUHOIAUG1",
  "BANMOISIEUHOIAUG2",
  "BANMOISIEUHOIAUG3",
  // Thêm voucher khác ở đây
];

// ⏱️ Delay giữa các request (ms)
const DELAY_MS = 1500;

// Hàm delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Hàm trích xuất SPC_ST từ cookie string
function extractSpcSt(cookie) {
  const match = cookie.match(/SPC_ST=([^;]+)/);
  return match ? match[1] : cookie.substring(0, 60) + '...';
}

// Hàm thực hiện request
function saveVoucher(cookie, voucherCode, accountIndex, voucherIndex) {
  return new Promise((resolve) => {
    const payload = { data: {voucher_code: voucherCode} };
    const postData = JSON.stringify(payload);

    const options = {
      hostname: 'shopee.vn',
      path: '/api/v2/voucher_wallet/save_platform_voucher_by_voucher_code',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(postData),
        'cookie': cookie,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.0',
        'referer': 'https://shopee.vn/',
        'x-requested-with': 'XMLHttpRequest',
        'x-api-source': 'pc',
        'origin': 'https://shopee.vn',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'vi-VN,vi;q=0.9',
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
          console.error(`\n❌ [A${accountIndex}|V${voucherIndex}] Lỗi giải nén:`, err.message);
          return resolve({ accountIndex, voucherIndex, voucherCode, cookie, success: false, error: 'decompress' });
        }

        try {
          const json = JSON.parse(data);
          resolve({
            accountIndex,
            voucherIndex,
            voucherCode,
            cookie,
            success: true,
            status: res.statusCode,
            data: json
          });
        } catch (err) {
          resolve({
            accountIndex,
            voucherIndex,
            voucherCode,
            cookie,
            success: false,
            status: res.statusCode,
            raw: data.substring(0, 500)
          });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`\n❌ [A${accountIndex}|V${voucherIndex}] Lỗi request:`, err.message);
      resolve({ accountIndex, voucherIndex, voucherCode, cookie, success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

// 🖨️ Hàm in kết quả theo điều kiện invalid_message_code
function printResult(result) {
  const spcSt = extractSpcSt(result.cookie);
  const voucher = result.voucherCode;

  if (!result.success) {
    console.log(`     ⚠️ THẤT BẠI | Lỗi: ${result.error || result.raw}`);
    return;
  }

  const json = result.data;
  const invalidCode = json?.invalid_message_code;
  const errorMsg = json?.error_msg || json?.message || 'Không có thông báo';

  if (invalidCode === 0) {
    // ✅ THÀNH CÔNG — in nổi bật SPC_ST và voucher
    console.log(`     ✅✅✅ THÀNH CÔNG ✅✅✅`);
    console.log(`        🍪 SPC_ST : ${spcSt}`);
    console.log(`        🎫 Voucher: ${voucher}`);
  } else {
    // ❌ KHÔNG THÀNH CÔNG — in lỗi
    console.log(`     ❌ KHÔNG THÀNH CÔNG | invalid_message_code: ${invalidCode}`);
    console.log(`        Lý do : ${errorMsg}`);
  }
}

// 🏃 Chế độ 1: Mỗi Account chạy hết tất cả Voucher
async function runAccountFirst() {
  console.log(`🚀 Chế độ: Account → Voucher`);
  console.log(`👤 Tổng account: ${COOKIES.length}`);
  console.log(`🎫 Tổng voucher: ${VOUCHER_CODES.length}\n`);

  for (let a = 0; a < COOKIES.length; a++) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`👤 Account ${a + 1}/${COOKIES.length}`);

    for (let v = 0; v < VOUCHER_CODES.length; v++) {
      console.log(`  🎫 Voucher ${v + 1}/${VOUCHER_CODES.length}: ${VOUCHER_CODES[v]}`);

      const result = await saveVoucher(COOKIES[a], VOUCHER_CODES[v], a + 1, v + 1);
      printResult(result);

      if (a < COOKIES.length - 1 || v < VOUCHER_CODES.length - 1) {
        await sleep(DELAY_MS);
      }
    }
  }

  console.log(`\n🏁 Hoàn tất!`);
}

// 🏃 Chế độ 2: Mỗi Voucher chạy qua tất cả Account
async function runVoucherFirst() {
  console.log(`🚀 Chế độ: Voucher → Account`);
  console.log(`👤 Tổng account: ${COOKIES.length}`);
  console.log(`🎫 Tổng voucher: ${VOUCHER_CODES.length}\n`);

  for (let v = 0; v < VOUCHER_CODES.length; v++) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎫 Voucher ${v + 1}/${VOUCHER_CODES.length}: ${VOUCHER_CODES[v]}`);

    for (let a = 0; a < COOKIES.length; a++) {
      console.log(`  👤 Account ${a + 1}/${COOKIES.length}`);

      const result = await saveVoucher(COOKIES[a], VOUCHER_CODES[v], a + 1, v + 1);
      printResult(result);

      if (a < COOKIES.length - 1 || v < VOUCHER_CODES.length - 1) {
        await sleep(DELAY_MS);
      }
    }
  }

  console.log(`\n🏁 Hoàn tất!`);
}

// =====================
// 🎬 CHẠY Ở ĐÂY
// =====================

// Mặc định: Mỗi account chạy hết tất cả voucher
runAccountFirst().catch(console.error);

// Đổi chế độ: comment dòng trên, bỏ comment dòng dưới
// runVoucherFirst().catch(console.error);