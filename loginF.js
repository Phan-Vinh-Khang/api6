const https = require('https');
const crypto = require('crypto');

const rawPassword = '123123aA';
const md5Hash = crypto.createHash('md5').update(rawPassword).digest('hex');
const passwordHash = crypto.createHash('sha256').update(md5Hash).digest('hex');

const payload = {
  client_identifier: {
    security_device_fingerprint: 'test9'
  },
  password: passwordHash,
  stay_logged_in: true,
  support_ivs: true,
  // username: 'zuup7sktdb',
  phone:'84522420504'
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'shopee.vn',
  path: '/api/v4/account/login_by_password',
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'accept-language': 'vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(data, 'utf8'),
    'cookie': 'SPC_F=I7kYsQ53aJZE0tJvNI64FzvNh8P1V41N',
  }
};

const req = https.request(options, (res) => {
  let spcSt = null;
  const setCookie = res.headers['set-cookie'];

  if (Array.isArray(setCookie)) {
    const cookie = setCookie.find(c => c.trim().startsWith('SPC_ST='));
    if (cookie) spcSt = cookie.split(';')[0].replace('SPC_ST=', '');
  } else if (typeof setCookie === 'string' && setCookie.trim().startsWith('SPC_ST=')) {
    spcSt = setCookie.split(';')[0].replace('SPC_ST=', '');
  }

  if (spcSt) {
    console.log("SPC_ST=" + spcSt);
  } else {
    console.log('Không tìm thấy SPC_ST trong response');
  }

  // Thu thập và in response body
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    console.log('\n=== RESPONSE BODY ===');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log(body);
    }
  });
});

req.on('error', (err) => {
  console.error('Request Error:', err.message);
});

req.write(data);
req.end();