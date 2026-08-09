const https = require('https');
const zlib = require('zlib');

const COOKIE = [
  'SPC_ST=NzlHM0J0NVNDa1E4UlV2ZCok9yonrP4yCiplzA/VM2IOeZXFBVBYeKJsAoDF3/qdOu+dON/9s1yynxVpNUKxlaiOiWOGi5LWS0kfA2jl0NBWkeo/S9fwYfLVqqmTeLM4SW758tzR7mE2hPIaF8fzccwMEZ94Jyvv95rCJeq1SHJ07oKSFvwIWb+m0KqAT/FP93mD1EYKDNaw1XyMBUzGgQ==.AH/Ob0pVuzn63s8LHue1hOXucDJrdRYkzNJNPVcXb4qC'
]

const payload = {
  address: {
    name: 'Vinh Khang',
    phone: '84564237793',
    country: 'VN',
    state: 'đồng nai',
    city: 'huyện định quán',
    district: 'xã ngọc định',
    address: 'Cafe Fastfood, Số 560, Đường Nguyễn Văn Cừ',
    geoinfo: {
      region: {
        latitude: 11.21866,
        longitude: 107.33959
      },
      user_adjusted: false,
      user_verified: true
    },
    vn_data_version: 'old'
  },
  address_flag: {
    as_default: true,
    as_pickup: true,
    as_return: true,
    as_cb_buyer_return: false,
    as_cb_seller_return: false
  }
};

const postData = JSON.stringify(payload);

const options = {
  hostname: 'shopee.vn',
  path: '/api/v4/account/address/create_user_address',
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(postData, 'utf8'),
    cookie: COOKIE

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

    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (err) {
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