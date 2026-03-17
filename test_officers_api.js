const http = require('http');

function makeRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    // Login with username
    console.log('=== Login as DGO ===');
    const login = await makeRequest({
        hostname: '127.0.0.1', port: 5020,
        path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { username: 'dgonoc001', password: 'Test@123' });

    console.log('Status:', login.status);
    if (!login.data.success) {
        console.log('Failed:', JSON.stringify(login.data, null, 2));
        // Try Password123
        const login2 = await makeRequest({
            hostname: '127.0.0.1', port: 5020,
            path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'dgonoc001', password: 'Password123' });
        console.log('Try2 Status:', login2.status);
        if (!login2.data.success) {
            console.log('Try2 Failed:', JSON.stringify(login2.data, null, 2));
            // Try password123
            const login3 = await makeRequest({
                hostname: '127.0.0.1', port: 5020,
                path: '/api/auth/login', method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { username: 'dgonoc001', password: 'password123' });
            console.log('Try3 Status:', login3.status);
            if (!login3.data.success) {
                console.log('Try3 Failed:', JSON.stringify(login3.data, null, 2));
                return;
            }
            login.data = login3.data;
        } else {
            login.data = login2.data;
        }
    }

    const token = login.data.data?.token || login.data.token;
    console.log('Token:', token ? token.substring(0, 40) + '...' : 'NONE');

    // Get Officers
    console.log('\n=== GET /api/officer/dgo/officers ===');
    const result = await makeRequest({
        hostname: '127.0.0.1', port: 5020,
        path: '/api/officer/dgo/officers', method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

test().catch(console.error);
