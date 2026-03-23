const axios = require('axios');

async function testApi() {
    try {
        // Test with NAME instead of ID
        const response = await axios.get('http://localhost:5020/api/master-data/application-sub-types?appTypeCode=Industry');
        console.log('Response (Name=Industry):', JSON.stringify(response.data, null, 2));
        
        // Test with Numeric ID
        const response2 = await axios.get('http://localhost:5020/api/master-data/application-sub-types?appTypeCode=2');
        console.log('Response (ID=2):', JSON.stringify(response2.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testApi();
