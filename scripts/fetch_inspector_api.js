const http = require('http');

// Configuration
const PORT = 5000;
const BASE_URL = `http://localhost:5000/api`;

async function post(endpoint, data, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function get(endpoint, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api${endpoint}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function main() {
    try {
        console.log("1. Logging in as DGO Admin for check...");
        const loginRes = await post('/auth/login', {
            username: "dgo_admin",
            password: "password123"
        });

        const token = loginRes.data?.token || loginRes.token;

        if (token) {
            console.log("Login successful. Checking existing users...");
            const usersRes = await get('/users?limit=100', token);

            let inspector = null;
            if (usersRes.data && Array.isArray(usersRes.data.users)) {
                inspector = usersRes.data.users.find(u => u.userType === 'ENFORCEMENT' || u.role === 'ENFORCEMENT');
            } else if (usersRes.users && Array.isArray(usersRes.users)) {
                inspector = usersRes.users.find(u => u.userType === 'ENFORCEMENT' || u.role === 'ENFORCEMENT');
            } else if (Array.isArray(usersRes)) {
                inspector = usersRes.find(u => u.userType === 'ENFORCEMENT' || u.role === 'ENFORCEMENT');
            } else if (usersRes.data && Array.isArray(usersRes.data)) {
                inspector = usersRes.data.find(u => u.userType === 'ENFORCEMENT' || u.role === 'ENFORCEMENT');
            }

            if (inspector) {
                console.log("\nFOUND INSPECTOR:");
                console.log(`ID: ${inspector._id || inspector.id}`);
                console.log(`Role: ${inspector.userType}\n`);
                return;
            } else {
                console.log("No inspector found in existing users.");
            }
        } else {
            console.log("DGO Admin login failed (might not exist yet). Proceeding to create via public register.");
        }

        console.log("2. Registering NEW Enforcement Officer...");
        // Randomize email/username to avoid duplicates on re-run
        const rand = Math.floor(Math.random() * 10000);
        const registerRes = await post('/auth/register', {
            applicantInfo: {
                firstName: "Inspector",
                lastName: `Officer${rand}`,
                emailId: `inspector${rand}@sgwa.gov.in`,
                mobileNumber: `9${rand.toString().padStart(9, '0')}`, // Ensure 10 digits
                title: "Mr",
                gender: "MALE",
                uidNumber: `12341234${rand}`,
                idProofType: "PAN",
                idProofNumber: `INSP${rand}X`,
                dateOfBirth: "1990-01-01"
            },
            communicationAddress: {
                addressLine1: "Enforcement Wing",
                state: "Rajasthan",
                district: "Jaipur",
                pincode: "302005"
            },
            loginCredentials: {
                username: `inspector${rand}`,
                password: "password123",
                securityQuestion: "City",
                securityAnswer: "Jaipur"
            },
            declaration: true,
            userType: "ENFORCEMENT"
        });

        if (registerRes.success && registerRes.data && registerRes.data.user) {
            const newUser = registerRes.data.user;
            console.log("\nCREATED INSPECTOR:");
            console.log(`ID: ${newUser.id || newUser._id}`);
            console.log(`UserType: ${newUser.userType}`);
            console.log(`Username: inspector${rand}`);
        } else {
            console.error("Registration failed:", JSON.stringify(registerRes, null, 2));
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

main();
