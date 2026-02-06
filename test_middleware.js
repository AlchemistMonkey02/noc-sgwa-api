// Test script to verify middleware ID mapping
const { validateExemptionEligibility } = require('./app/noc/exemption.middleware');

// Mock request with ID "6"
const mockReq = {
    body: {
        applicationType: "6",
        waterQualityType: "Fresh Water",
        agriculturalDetails: {
            state: "RJ",
            assessmentUnitBlockTehsil: "JAIPUR",
            waterRequirementKLD: 30
        }
    }
};

// Mock response
const mockRes = {
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        this.responseData = data;
        console.log('\n❌ FAILED - Middleware rejected the request:');
        console.log(JSON.stringify(data, null, 2));
        return this;
    }
};

// Mock next
let nextCalled = false;
const mockNext = () => {
    nextCalled = true;
};

console.log('Testing middleware with applicationType: "6"...\n');
console.log('Original request body:', JSON.stringify(mockReq.body, null, 2));

validateExemptionEligibility(mockReq, mockRes, mockNext);

if (nextCalled) {
    console.log('\n✅ SUCCESS - Middleware passed validation');
    console.log('Mapped applicationType:', mockReq.body.applicationType);
    console.log('Expected: "Agriculture Activities"');

    if (mockReq.body.applicationType === "Agriculture Activities") {
        console.log('\n🎉 ID mapping works correctly!');
    } else {
        console.log('\n⚠️  Mapping did not work as expected');
    }
} else if (!mockRes.responseData) {
    console.log('\n⚠️  Middleware did not call next() or send response');
}
