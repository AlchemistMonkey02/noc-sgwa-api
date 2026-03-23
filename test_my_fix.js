const API_URL = 'http://localhost:5020/api';

async function testTracking() {
    try {
        // 1. Try a non-existent ID to ensure we get a clean 404 (and not a 500)
        console.log('Testing non-existent ID...');
        const res404 = await fetch(`${API_URL}/applications/noc/track/NON_EXISTENT_ID`);
        const data404 = await res404.json();
        console.log(`Response: ${res404.status}`, data404);

        // 2. Try the public endpoint too
        console.log('\nTesting public endpoint...');
        const resPublic = await fetch(`${API_URL}/public/track/NON_EXISTENT_ID`);
        const dataPublic = await resPublic.json();
        console.log(`Response: ${resPublic.status}`, dataPublic);

        console.log('\n✅ Verification complete! (404 is expected for random IDs, 500 would mean a code error)');
    } catch (err) {
        console.error('❌ Test execution error:', err);
    }
}

testTracking();
