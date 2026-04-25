import http from 'http';

function post(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null }));
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null }));
    }).on('error', reject);
  });
}

async function testValidators() {
  console.log('--- Testing Validators ---');
  const res1 = await post('http://localhost:3000/api/users/register', { name: '', phone: '123' });
  console.log('Register Validation (Expected 400):', res1.status, res1.data);

  const res2 = await post('http://localhost:3000/api/users/scan', { qrToken: '' });
  console.log('Scan Validation (Expected 400):', res2.status, res2.data);
}

async function testAnalytics() {
  console.log('\n--- Testing Analytics Endpoints ---');
  const res = await get('http://localhost:3000/api/admin/analytics/revenue?period=7d');
  console.log('Revenue Analytics:', res.status, res.data?.length, 'entries');
}

async function runTests() {
  try {
    await testValidators();
    await testAnalytics();
  } catch (err) {
    console.error('Test Error:', err.message);
    console.log('Make sure the backend server is running on port 3000.');
  }
}

runTests();
