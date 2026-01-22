const axios = require('axios');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const API_URL = 'http://localhost:5000/api/officer/enforcement';
// Use the ID from the previous cleanup output or context
const APPLICATION_ID = '696385af85ba8d751b6f1d3a';
const SECRET = process.env.JWT_SECRET || 'secret';

async function issueNOC() {
    try {
        // Generate Token
        const token = jwt.sign(
            {
                id: '6964cfa5400785e8c03914f9', // Officer ID (from previous token script)
                userType: 'ENFORCEMENT'
            },
            SECRET,
            { expiresIn: '1h' }
        );

        console.log('Generated Token:', token);

        const url = `${API_URL}/applications/${APPLICATION_ID}/issue-noc`;
        console.log(`Sending POST request to: ${url}`);

        const response = await axios.post(
            url,
            {
                remarks: "Approved with Annexure 13 Format",
                maxAnnualExtraction: 1000,
                validityYears: 3
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

issueNOC();
