const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const API_URL = 'http://localhost:5000/api';
const USER_ID = '6964cfabefac9d7b41a3edfa';
// We will dynamically fetch company ID in the script if possible, or we need to find the one we just created
// For now let's just use the profile endpoint which auto-finds it. 
// But for "by ID" test, we need the ID.
// Let's rely on the first profile call to give us the company ID.
const JWT_SECRET = '79caecd9aa700670af2695940e21807ebf1f1f2ae1177fa7ee7673b37f988dad';

// Generate Token
const token = jwt.sign(
    {
        id: USER_ID,
        userType: 'APPLICANT',
        email: "contact@techsolutions.com"
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

console.log('Generated Token:', token);

async function testProfiles() {
    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 1. Get User Profile (Should include company)
        console.log('\n--- Testing User Profile (GET /api/auth/profile) ---');
        try {
            const userRes = await axios.get(`${API_URL}/auth/profile`, { headers });
            console.log('User Profile Response Status:', userRes.status);
            // Log specifically if company is present
            if (userRes.data.data.company) {
                console.log('✅ Company data found in User Profile:', userRes.data.data.company.companyName);
                console.log('✅ Top-level companyId found:', userRes.data.data.companyId);
            } else {
                console.log('❌ Company data MISSING in User Profile');
            }
        } catch (error) {
            console.error('User Profile Error:', error.response ? error.response.data : error.message);
        }

        // 2. Get Company Profile (via user link)
        console.log('\n--- Testing Company Profile (GET /api/companies/profile) ---');
        let fetchedCompanyId = null;
        try {
            const compRes = await axios.get(`${API_URL}/companies/profile`, { headers });
            console.log('Company Profile Response Status:', compRes.status);
            console.log('Company Name:', compRes.data.data.companyName);
            fetchedCompanyId = compRes.data.data._id || compRes.data.data.id;
            console.log('Fetched Company ID:', fetchedCompanyId);
        } catch (error) {
            console.error('Company Profile Error:', error.response ? error.response.data : error.message);
        }

        // 3. Get Company by ID
        if (fetchedCompanyId) {
            console.log(`\n--- Testing Company By ID (GET /api/companies/${fetchedCompanyId}) ---`);
            try {
                const byIdRes = await axios.get(`${API_URL}/companies/${fetchedCompanyId}`, { headers });
                console.log('Company By ID Status:', byIdRes.status);
                // Log FULL data as requested by user to prove "all details" are present
                console.log('Company By ID Data:', JSON.stringify(byIdRes.data, null, 2));
            } catch (error) {
                console.error('Company By ID Error:', error.response ? error.response.data : error.message);
            }
        } else {
            console.log('Skipping Company By ID test (no ID found)');
        }

    } catch (error) {
        console.error('Global Error:', error.message);
    }
}

testProfiles();
