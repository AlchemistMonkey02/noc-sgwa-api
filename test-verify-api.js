const http = require('http');

const data = JSON.stringify({
    status: 'APPROVED',
    remarks: 'Test verification'
});

const options = {
    hostname: '127.0.0.1',
    port: 5020,
    path: '/api/officer/common/verify-doc/15e2dd69-1cb1-4261-9117-497ff2713242',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', responseBody);
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
