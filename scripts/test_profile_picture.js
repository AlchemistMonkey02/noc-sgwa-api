const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Configuration
const API_URL = 'http://localhost:5000/api';
const USER_ID = '6964cfabefac9d7b41a3edfa';
const JWT_SECRET = '79caecd9aa700670af2695940e21807ebf1f1f2ae1177fa7ee7673b37f988dad';

// Generate Token
const token = jwt.sign(
    {
        id: USER_ID,
        userType: 'APPLICANT',
        email: "applicant@test.com"
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

console.log('Generated Token:', token);

async function testProfilePicture() {
    try {
        const headers = {
            'Authorization': `Bearer ${token}`
        };

        // 1. Get Current Profile (check if profilePicture exists)
        console.log('\n--- Testing GET Profile (checking profilePicture field) ---');
        try {
            const profileRes = await axios.get(`${API_URL}/auth/profile`, { headers });
            console.log('Profile Response Status:', profileRes.status);
            if (profileRes.data.data.profilePicture) {
                console.log('✅ Profile Picture ID:', profileRes.data.data.profilePicture);
            } else {
                console.log('❌ No profile picture set yet');
            }
        } catch (error) {
            console.error('Profile Error:', error.response ? error.response.data : error.message);
        }

        // 2. Upload Profile Picture (if you have a test image)
        // Uncomment this section if you want to test upload
        /*
        console.log('\n--- Testing Upload Profile Picture ---');
        const testImagePath = 'path/to/test/image.jpg'; // Replace with actual path
        
        if (fs.existsSync(testImagePath)) {
            const form = new FormData();
            form.append('profilePicture', fs.createReadStream(testImagePath));

            const uploadHeaders = {
                ...headers,
                ...form.getHeaders()
            };

            try {
                const uploadRes = await axios.post(
                    `${API_URL}/auth/profile-picture`,
                    form,
                    { headers: uploadHeaders }
                );
                console.log('Upload Status:', uploadRes.status);
                console.log('Upload Response:', JSON.stringify(uploadRes.data, null, 2));
            } catch (error) {
                console.error('Upload Error:', error.response ? error.response.data : error.message);
            }
        } else {
            console.log('⚠️ Test image not found. Skipping upload test.');
        }
        */

    } catch (error) {
        console.error('Global Error:', error.message);
    }
}

testProfilePicture();
