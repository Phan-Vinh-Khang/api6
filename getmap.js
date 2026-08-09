const https = require('https');

const query = 'xã ngọc định, huyện định quán, đồng nai';
const apiKey = 'e11c2b0cb27948bc885b20edeb5f69fe';

const params = new URLSearchParams({
  q: query,
  key: apiKey,
  no_annotations: '1',
  language: 'vn',
});

const url = `https://api.opencagedata.com/geocode/v1/json?${params.toString()}`;

https.get(
  url,
  {
    headers: {
      // 'Accept': 'application/json, text/javascript, */*; q=0.01',
      'User-Agent': 'test',
    },
  },
  (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));

      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (error) {
        console.error('Failed to parse response:', error.message);
        console.log('Raw response:', data);
      }
    });
  }
).on('error', (error) => {
  console.error('Request failed:', error.message);
  process.exit(1);
});