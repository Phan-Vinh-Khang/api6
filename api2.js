// get_shopee_order_list.js

const https = require('https');
const zlib = require('zlib');

const options = {
  hostname: 'chatbot.shopee.vn',

  path:
    '/api/v2/order_list' +
    '?page_num=0' +
    '&page_size=5' +
    '&status=0' +
    '&statusText=T%E1%BA%A5t+c%E1%BA%A3' +
    '&user_type=1' +
    '&query_type=0' +
    '&is_seller=0',

  method: 'GET',

  headers: {

    'cookie':
      // 'SPC_ST=ODBCdXNHUlg0RWVhWlhwZlpvoBIBDjNgcaOrQxXs5coDPoT79GyfZrw57Z3kledY7Q38qxbafOpk6+6SYjdrLBL3ZfBjZk+vh6YB2/OIAfekR8dJOsTE3YcXtBc5oJg+6GPCJXPrp9aWkiH9ZUy2CVxL7I1hy4eD+nwHMt6gVZM7VVNnJvYFEmrcsGhITZB6Z5KpkY+KkfSv+7ZRh5SYnw==.AJgPrzleUQriY+KDURlgRZLZpUK18/ZrIhfiAK04nkVx',
      'SPC_ST=TXJsUXJQd1lHSGszM0V0Yzjfnw1Gihx5imR4ajawgxCC6fyvXA+ZDyEhRq3hhruxir82LJ6nCqex35R/WFb8rhkOkNyH0OV3DO3GMSKsjkP7H5gZWElOXoyF0Pu2K8su+XlOyfsbP2xDGxlUQVuPNGtDOR4fV/w7fjsPMDB4JoLFda0/3SnBO+RxY0R5mHwBU2fvLzCBOCs+mFdq2b5Ncg==.APw5bc8DZzumjEOVAcfKgWLErmKRlYOehgNLFDveUt2m',
    'shopee-region': 'vn',
  }
};


// ============================================================
// REQUEST
// ============================================================

const req = https.request(options, (res) => {

  console.log('========================================');
  console.log('Status code      :', res.statusCode);
  console.log('Content-Type     :', res.headers['content-type']);
  console.log('Content-Encoding :', res.headers['content-encoding']);
  console.log('========================================');

  const chunks = [];

  res.on('data', (chunk) => {
    chunks.push(chunk);
  });

  res.on('end', () => {

    const buffer = Buffer.concat(chunks);

    console.log('Response size    :', buffer.length, 'bytes');

    let decompressed;

    try {

      const encoding = res.headers['content-encoding'];

      if (encoding === 'gzip') {

        decompressed = zlib.gunzipSync(buffer);

      } else if (encoding === 'deflate') {

        decompressed = zlib.inflateSync(buffer);

      } else if (encoding === 'br') {

        decompressed = zlib.brotliDecompressSync(buffer);

      } else {

        decompressed = buffer;
      }

    } catch (err) {

      console.error('\n❌ Lỗi giải nén response:');
      console.error(err.message);

      console.log(
        '\nResponse HEX:',
        buffer.subarray(0, 100).toString('hex')
      );

      return;
    }

    const data = decompressed.toString('utf8');

    console.log('Decompressed size:', data.length, 'bytes');

    // ========================================================
    // JSON
    // ========================================================

    try {

      const json = JSON.parse(data);

      console.log('\n========================================');
      console.log('           JSON RESPONSE');
      console.log('========================================\n');

      console.log(JSON.stringify(json, null, 2));

    } catch (err) {

      console.error('\n❌ JSON parse error:', err.message);

      console.log('\n========================================');
      console.log('             RAW RESPONSE');
      console.log('========================================\n');

      console.log(data.substring(0, 10000));
    }
  });
});


// ============================================================
// REQUEST ERROR
// ============================================================

req.on('error', (err) => {

  console.error('\n❌ Request error:');
  console.error(err.message);

});

req.end();