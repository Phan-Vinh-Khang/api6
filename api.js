// get_shopee_orders.js

const https = require('https');
const zlib = require('zlib');

const options = {
  hostname: 'shopee.vn',

  path: '/api/v4/order/get_all_order_and_checkout_list?_oft=2048&limit=5&offset=0',

  method: 'GET',

  headers: {
    'accept': 'application/json',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
    'content-type': 'application/json',

    'referer': 'https://shopee.vn/user/purchase/',

    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0',

    'x-api-source': 'pc',
    'x-requested-with': 'XMLHttpRequest',
    'x-shopee-language': 'vi',
    'x-sz-sdk-version': '1.12.40',

    // =========================
    // COOKIE
    // =========================
    'cookie':
      'REC_T_ID=b0bbb022-8c1a-11f1-ab1e-3624a835ec0f; ' +
      'SPC_SI=4VkyagAAAABPSUQ3THRjRCvw9wIAAAAAVkR4VDNKQVM=; ' +
      '_gcl_au=1.1.1782975992.1785418165; ' +
      'language=vi; ' +
      'ssr-tz=Etc/GMT-7; ' +
      '_fbp=fb.1.1785418167343.465573881250535319; ' +
      '_QPWSDCXHZQA=70444d25-7d99-4900-9bce-e6e281b2811a; ' +
      'REC7iLP4Q=5a750146-27d7-423c-838f-b32222bff838; ' +
      '_ga=GA1.1.230024535.1785418173; ' +
      'SPC_F=7oon9gTCgWD283mKY6VFFWyDio9l1nxN; ' +
      'SPC_CLIENTID=N29vbjlnVENnV0Qyhvylqrvqkellgfmh; ' +
      'SPC_EC=-; ' +
      'SPC_U=12210561081; ' +

      'SPC_R_T_ID=1MOlAvb6AFQFmatoShupthjHhQ9I/triUoeAnTQuhQZ4lhYstFKxLhTtXji3khRzEecRXayuF0LCUgoJsfm8SKAszWk81f1WI/8FJ7D0ubxAAv61x3xRzBjlN6elhQL5u4STx7LIlN82Oh49gB8x0XBecv7F1vU5lSWq3Clfs+o=; ' +

      'SPC_R_T_IV=aEtDYk8xalNlRlFpbjRZTQ==; ' +

      'SPC_T_ID=1MOlAvb6AFQFmatoShupthjHhQ9I/triUoeAnTQuhQZ4lhYstFKxLhTtXji3khRzEecRXayuF0LCUgoJsfm8SKAszWk81f1WI/8FJ7D0ubxAAv61x3xRzBjlN6elhQL5u4STx7LIlN82Oh49gB8x0XBecv7F1vU5lSWq3Clfs+o=; ' +

      'SPC_T_IV=aEtDYk8xalNlRlFpbjRZTQ==; ' +

      'SPC_ST=ODBCdXNHUlg0RWVhWlhwZlpvoBIBDjNgcaOrQxXs5coDPoT79GyfZrw57Z3kledY7Q38qxbafOpk6+6SYjdrLBL3ZfBjZk+vh6YB2/OIAfekR8dJOsTE3YcXtBc5oJg+6GPCJXPrp9aWkiH9ZUy2CVxL7I1hy4eD+nwHMt6gVZM7VVNnJvYFEmrcsGhITZB6Z5KpkY+KkfSv+7ZRh5SYnw==.AJgPrzleUQriY+KDURlgRZLZpUK18/ZrIhfiAK04nkVx; ' +

      '_hjSessionUser_868286=eyJpZCI6IjEzOTVhZWViLTE3NjgtNTBlYy04YzQyLWE1NGU4MmYzMjEzZSIsImNyZWF0ZWQiOjE3ODU0MTk1MDk1MzAsImV4aXN0aW5nIjp0cnVlfQ==; ' +

      'AC_CERT_D=gqRjZGVrxHeFomtpuDE0MjUxOmNhcHRjaGFfY29va2llX2tleaJrdtEAAaRhbGdv0gAAAGSjZGVrwKJjdMRAAAAADGE52xUo3Wm3iC5rRYtPIg498IF1KHCytnPhbjJaI6YqfVhynmwqpbv6ogr0FzEZ/3RtNpmV6B9rxJ+WP6pjaXBoZXJ0ZXh0xQNcAAAADJ62Vf6Tb4+Neur5kSjp70EnCwk74yRECRVGjvCRGUMD02YJS1VIZJJw9h59Kz0BSNHbo/l7ymwgjRmIHNTqtVPhaSg2DAyA0LZKvcgG/qcC65e8Gv2KGgGjnxGQiplM9uhGOYZBpkbEukHduZNjZM6TaxyxkXEUuBXEnhy25BdjV2d7J+pHevyBAVeelxkpi4bdh8ezPlWY5hAws8DID41bB+Z3i7XH2o7XzdbOJ3+1ZA/ZLD/Fy9aH2l9m6iBYpmpIQQXnyRjAYTN3u23NSIF/tJ6Tfkozwn3wfi46fubma7nRZ5PI2FlWsaNqFoSUftWpPFdhaBq6LXmWAEojoFYx22eCmhRGotAZMPROfJdIobOupuVR44far9BHuz6konorpgBkFnQDIgVRJyxqbORfhLW0lGHkKHEolWvDUWyXGQRV/8sN67tBza0AyYZaWsbD1clIPOVS2QQmZYAqRtmwno6lp+pvM4PC3eotfBr3C1O0KfkNsR87gSCV4L4zG2LzM63LVB6zR5mSi+KaLIx66LP99zPqTr4HuIg2q1i+mpF3sdSKqs33ia8nCaib1HLKGQ2HJnqheU1krRBIqbPyAfVbcEQt8mwT8GOj7ruBa4SF2fPiLvkELmD2/+oD5j9ogZN+5kd3mWug7wHplyVXvSTRR9cFGHHEPVkWYc/jfghslbJKIX58l3MG7rXMyFUuQaOKdYQImBvi/FF3+1zp4y5pAlJJmHnEcMdsTA61mcxlrW+3XVH8DM7SzZNgTB6Izevh/WMTwakWRioZwwRIQblnJPrmcL9JYTxvZSULJJ7P+HTUqqbDfjSVZ3o1/OPasTmhb5PNZRxQs+4tuhkattE1YrXd6FXe28wJyKE0gO7Q53I7/RuHXqPWe3B5+/AES32EyE786n3lLVsmDR1XlH/Kq28lM3hw3SiRai3p06pXuZurBeB8V+kdSOhw8+dGk2g4MAm9OFbSyOM9JDgxhky3RGr9e0iVRBgrBx4YdwQzixjbl/itXkk2n9XUxTQZP9/kO4Jpixw2wGT5xVqVP1rnSZ8jFqW8+MdmfAqvxvPJxbg1c2O9GU7rto05aCdwXM60WWgR7CXpPxOgQ28IYtmbkKI9hBsPSUJFX9XRlITWUkQIqyw=; ' +

      '_sapid=35e410e936207c8330b9dceba074348d0a3853bb857d9d3f765b54b6; ' +

      'csrftoken=hyANXFffHV1Xx6PqwPVsxFM8cNcZgxRz; ' +

      'SPC_SEC_SI=v1-MXhlbFZNUG9PRGpmanhuUzNHuXqSjyjeXo2wbisMVsbcP/ak9NQAMp9ZTaT5sCjYySVrLomkHUJOvVbl5v9uvCgp8AEVVBunAZksu4wjUtg=; ' +

      'SPC_CDS_CHAT=5cb85792-4f2c-48f3-af16-c45552217ecd; ' +
      'sense_sa_r=s; ' +

      '_hjSession_868286=eyJpZCI6ImNjZjU3NDNmLWFlZDUtNGEyMi1hMWMzLTI3ZDE0ZjcxNzUxNCIsImMiOjE3ODU1MTMwMDM0OTYsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MX0=; ' +

      '_ga_4GPP1ZXG63=GS2.1.s1785513003$o5$g1$t1785514064$j60$l1$h545765338; ' +

      'shopee_webUnique_ccd=YMzgn%2B5FM4%2FSf9GGu8IepQ%3D%3D%7CPQEQE0oQ9ikZHJJ9%2Bg1C3hpQA3O2EakkD1xc4HP8tzoT4fs51fwsRrSq%2B5hG1cl%2FkAUQ5z9iuTXTPWnFglQ%3D%7CM7Kw%2B%2FiOkvc7IbqH%7C08%7C3; ' +

      'ds=d68dd1ed9cb5edde11ff9aaf722651fd',

    // =========================
    // TOKEN MỚI
    // =========================

    'x-csrftoken':
      'hyANXFffHV1Xx6PqwPVsxFM8cNcZgxRz',

    'af-ac-enc-dat':
      'acb8bbfc3f67708d',

    'af-ac-enc-sz-token':
      'THuPjUepviibNZZ5OfE3AA==|OgEQE0oQ9ikZHJJ9+g1C3hpQA3O2EakkD1xc4K0rtzoT4fs51fwsRrSq+5hG1cl/kAUQ5z9iuTXTPWnFglQ=|M7Kw+/iOkvc7IbqH|08|3',

    'x-sap-ri':
      '5fc86c6adf150a44bcbb6d3a0b0128d59a8c28539cf51ff8774e',

    'x-sap-sec':
      '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'
  }
};


// ============================================================
// REQUEST
// ============================================================

function printOrderSummaries(json) {
  const orders = json?.new_data?.order_or_checkout_data || [];

  console.log('\n========================================');
  console.log('           ORDER SUMMARY');
  console.log('========================================\n');
  console.log('Số đơn hàng:', orders.length);
  console.log('Next offset:', json?.new_data?.next_offset ?? 'N/A');

  orders.forEach((entry, index) => {
    const detail = entry?.order_list_detail || {};
    const info = detail?.info_card || {};
    const statusLabel = detail?.status?.list_view_status_label?.text
      || detail?.status?.status_label?.text
      || 'N/A';
    const orderId = info?.order_id || 'N/A';
    const card = info?.order_list_cards?.[0] || {};
    const shopName = card?.shop_info?.shop_name || 'N/A';
    const products = (card?.product_info?.item_groups || [])
      .flatMap((group) => group?.items || [])
      .map((item) => item?.name || '')
      .filter(Boolean);

    console.log(`[${index + 1}] order_id=${orderId}`);
    console.log(`    shop=${shopName}`);
    console.log(`    status=${statusLabel}`);
    console.log(`    products=${products.join(' | ') || 'N/A'}`);
  });
}

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

    console.log('Compressed size  :', buffer.length, 'bytes');

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

        // Không nén
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

    try {

      const json = JSON.parse(data);

      printOrderSummaries(json);

      console.log('\n========================================');
      console.log('           FULL JSON RESPONSE');
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


req.on('error', (err) => {

  console.error('\n❌ Request error:');
  console.error(err.message);

});


req.end();