const http = require('http');

const PORT = 5000;

function testRoute() {
    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/officer/dgo/officers?role=INSPECTION_OFFICER',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
            // Note: This will return 401 Unauthorized likely, but NOT 404 if route exists.
            // If route is missing, it returns 404.
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Body:', body);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

testRoute();
