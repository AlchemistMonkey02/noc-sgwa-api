const axios = require('axios');

async function runTest() {
    const baseUrl = 'http://127.0.0.1:5005/api';
    let token = '';
    let companyId = '';

    try {
        console.log('--- Step 1: Login ---');
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            username: 'usernoc001',
            password: 'password123'
        });
        token = loginRes.data.data?.token;
        if (!token) throw new Error('No token received');
        console.log('✅ Login successful. Token starts with:', token.substring(0, 10));

        console.log('\n--- Step 2: Register Company ---');
        const companyData = {
            companyName: 'Test Sync Co ' + Date.now(),
            companyType: 'PRIVATE_LIMITED', // Fix: Uppercase
            industryType: 'MANUFACTURING', // Fix: Required field
            incorporationId: 'INC' + Date.now(),
            dateOfIncorporation: '2020-01-01', // Fix: Use correct field name for validator
            gstNumber: '22AAAAA' + Math.floor(1000 + Math.random() * 9000) + 'A1Z5', // More realistic GST
            panNumber: 'AAAAA' + Math.floor(1000 + Math.random() * 9000) + 'A', // More realistic PAN
            email: 'contact' + Date.now() + '@testsync.com', // Unique email
            phone: '9876543210',
            registeredAddress: {
                addressLine1: 'Reg Address 1',
                state: 'Rajasthan',
                district: 'Jaipur',
                pincode: '302001'
            },
            communicationAddress: {
                addressLine1: 'Comm Address 1',
                state: 'Rajasthan',
                district: 'Jaipur',
                pincode: '302001'
            },
            authorizedPerson: {
                name: 'Auth Person',
                designation: 'Director',
                email: 'auth' + Date.now() + '@testsync.com',
                phone: '9876543210'
            }
        };

        const regRes = await axios.post(`${baseUrl}/companies/register`, companyData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (regRes.data.success) {
            companyId = regRes.data.data._id;
            console.log('✅ Company registered with ID:', companyId);
        } else {
            console.error('❌ Registration failed:', regRes.data);
            return;
        }

        console.log('\n--- Step 3: Fetch Profile ---');
        const profileRes = await axios.get(`${baseUrl}/companies/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile fetched');
        console.log('Company Name:', profileRes.data.data.companyName);

        console.log('\n--- Step 4: Update Company ---');
        const updateData = {
            ...companyData,
            companyName: 'Updated Sync Co',
            authorizedPerson: {
                ...companyData.authorizedPerson,
                name: 'Updated Auth Person'
            }
        };
        // Remove unique fields that shouldn't be changed or might cause issues if not supported in update
        delete updateData.gstNumber;
        delete updateData.panNumber;

        const updateRes = await axios.put(`${baseUrl}/companies/${companyId}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Company updated');
        console.log('New Name:', updateRes.data.data.companyName);

        console.log('\n--- Step 5: Verify Sync ---');
        const finalProfileRes = await axios.get(`${baseUrl}/companies/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (finalProfileRes.data.data.companyName === 'Updated Sync Co' &&
            finalProfileRes.data.data.authorizedPerson.name === 'Updated Auth Person') {
            console.log('✅ SYNC VERIFIED SUCCESSFULLY');
        } else {
            console.error('❌ Sync failed validation');
            console.log('Expected: Updated Sync Co / Updated Auth Person');
            console.log('Actual:', finalProfileRes.data.data.companyName, '/', finalProfileRes.data.data.authorizedPerson.name);
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ Test Failed (Response Error):', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Test Failed (General Error):', error.message);
        }
    }
}

runTest();
