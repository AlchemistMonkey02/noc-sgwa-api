const http = require('http');

// Configuration
const PORT = 5000;
const BASE_URL = `http://localhost:5000/api`;

async function post(endpoint, data) {
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

async function main() {
    try {
        console.log("Registering NEW Inspection Officer...");
        // Randomize to ensure unique
        const rand = Math.floor(Math.random() * 10000);
        const username = `inspector_real_${rand}`;

        const registerRes = await post('/auth/register', {
            applicantInfo: {
                firstName: "Real",
                lastName: "Inspector",
                emailId: `inspector_real_${rand}@sgwa.gov.in`,
                mobileNumber: `9${rand.toString().padStart(9, '0')}`,
                title: "Mr",
                gender: "MALE",
                uidNumber: `99991234${rand}`,
                idProofType: "PAN",
                idProofNumber: `INSPZ${rand}K`,
                dateOfBirth: "1992-05-15"
            },
            communicationAddress: {
                addressLine1: "Inspection Wing, GW Department",
                state: "Rajasthan",
                district: "Jaipur",
                pincode: "302001"
            },
            loginCredentials: {
                username: username,
                password: "password123",
                securityQuestion: "Role",
                securityAnswer: "Inspector"
            },
            declaration: true,
            userType: "INSPECTION_OFFICER" // Correct Role
        });

        if (registerRes.success && registerRes.data && registerRes.data.user) {
            const newUser = registerRes.data.user;
            console.log("\nSUCCESS! CREATED INSPECTION OFFICER:");
            console.log(`ID: ${newUser.id || newUser._id}`);
            console.log(`Username: ${username}`);
            console.log(`Role: ${newUser.userType}`);
        } else {
            console.error("Registration failed:", JSON.stringify(registerRes, null, 2));
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

main();
