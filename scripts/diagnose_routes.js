const http = require('http');

async function checkRoute(port, path, name) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`[${name}] URL: http://localhost:${port}${path}`);
                console.log(`Status: ${res.statusCode}`);
                // Only print first 100 chars of response
                console.log(`Response: ${body.substring(0, 100).replace(/\n/g, '')}...`);
                console.log('---');
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`[${name}] Port ${port} Error: ${e.message}`);
            // console.log(`(Server likely not running on port ${port})`);
            console.log('---');
            resolve();
        });

        // Add timeout
        req.setTimeout(2000, () => {
            req.destroy();
            console.log(`[${name}] Port ${port} Timeout`);
            resolve();
        });

        req.end();
    });
}

async function run() {
    console.log("diagnosing API Routes...\n");

    // Check Port 3000
    await checkRoute(3000, '/api/users', 'Port 3000 - Users');
    await checkRoute(3000, '/api/officer/dgo/officers', 'Port 3000 - DGO Officers');

    // Check Port 5000
    await checkRoute(5000, '/api/users', 'Port 5000 - Users');
    await checkRoute(5000, '/api/officer/dgo/officers', 'Port 5000 - DGO Officers');
}

run();
