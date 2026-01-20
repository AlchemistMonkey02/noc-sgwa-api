const http = require('http');

const PORT = 5000; // Try 5000 first as it seems to be the active one
const CREDENTIALS = {
    username: "dgo_admin",
    password: "password123"
};

function request(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function main() {
    try {
        console.log(`1. Logging in as DGO (${CREDENTIALS.username}) on Port ${PORT}...`);
        const loginRes = await request('POST', '/api/auth/login', CREDENTIALS);

        if (loginRes.statusCode !== 200 || !loginRes.data.success) {
            console.error("Login Failed:", loginRes.data);
            return;
        }

        const token = loginRes.data.data.token || loginRes.data.token;
        console.log("✓ Login Successful. Token received.\n");

        console.log("2. Fetching Inspection Officers...");
        const officersRes = await request('GET', '/api/officer/dgo/officers?role=INSPECTION_OFFICER', null, token);

        if (officersRes.statusCode === 200) {
            console.log("✓ API Success! Officers found:");
            console.log(JSON.stringify(officersRes.data, null, 2));
        } else {
            console.error(`✗ API Failed with Status ${officersRes.statusCode}:`);
            console.error(JSON.stringify(officersRes.data, null, 2));
        }

    } catch (error) {
        console.error("Script Error:", error.message);
    }
}

main();
