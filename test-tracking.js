// Using native fetch in Node 20

// Using native fetch since Node 20 is available
async function runTest() {
    try {
        const baseUrl = 'http://127.0.0.1:3000/api';

        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'applicant@test.com', password: 'Password@123' })
        });

        if (!loginRes.ok) {
            const errText = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${errText}`);
        }
        const loginData = await loginRes.json();
        const token = loginData.data.token;
        console.log('   Logged in successfully.');

        // 2. Create Application
        console.log('\n2. Creating Draft Application...');
        const createRes = await fetch(`${baseUrl}/applications/noc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                applicationCategory: 'WITHDRAWAL',
                projectType: 'INFRASTRUCTURE',
                applicationType: 'NEW',
                applicationSubType: 'MAJOR',
                waterQualityType: 'FRESH',
                groundWaterUtilizationFor: 'DOMESTIC',
                dateOfCommencement: '2026-01-01',
                sectorType: 'INFRASTRUCTURE'
            })
        });

        if (!createRes.ok) {
            const errText = await createRes.text();
            throw new Error(`Creation failed: ${errText}`);
        }

        const createData = await createRes.json();
        const trackingId = createData.data.trackingId;
        console.log(`   Application Created!`);
        console.log(`   Tracking ID: ${trackingId}`);

        // 3. Track Application
        console.log(`\n3. Tracking by ID: ${trackingId}...`);
        const trackRes = await fetch(`${baseUrl}/applications/noc/track/${trackingId}`);

        if (!trackRes.ok) throw new Error(`Tracking failed: ${trackRes.statusText}`);
        const trackData = await trackRes.json();

        console.log('   Tracking Success!');
        console.log('   Status:', trackData.data.status);
        console.log('   Current Location:', trackData.data.currentLocation);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

runTest();
