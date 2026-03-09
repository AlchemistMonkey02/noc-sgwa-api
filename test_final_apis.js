const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./app/auth/user.model');
require('dotenv').config();

const BASE_URL = 'http://127.0.0.1:4000/api';

async function testNewApis() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        console.log("--- 1. Testing GET /api/master/rejection-reasons (Public) ---");
        const rejectionRes = await axios.get(`${BASE_URL}/master/rejection-reasons`);
        console.log("✅ getRejectionReasons:", rejectionRes.status, rejectionRes.data.data.length, "reasons found.\n");

        console.log("--- 2. Testing POST /api/applications/noc/:id/payment ---");
        // Get an existing applicant user token
        const authService = require('./app/auth/auth.service');
        const email = `test_applicant_${Date.now()}@test.com`;
        const phone = `99${Math.floor(Math.random() * 100000000)}`;

        const applicantObj = await authService.register({
            firstName: "Test",
            lastName: "Applicant",
            username: `applicant_${Date.now()}`,
            email: email,
            phone: phone,
            password: "Password@123",
            userType: "APPLICANT"
        });

        const loginRes = await authService.login(email, "Password@123", "APPLICANT");
        const applicantToken = loginRes.token;
        const dummyId = new mongoose.Types.ObjectId().toString();

        try {
            await axios.post(`${BASE_URL}/applications/noc/${dummyId}/payment`,
                { amount: 500, transactionId: "TEST_TXN" },
                { headers: { Authorization: `Bearer ${applicantToken}` } }
            );
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log("✅ savePaymentDetails endpoint reached correctly (handled 404 for non-existent app)\n");
            } else {
                throw error;
            }
        }

        console.log("--- 3. Testing GET /api/officer/enforcement/applications/queue (Enforcement) ---");
        // Create active enforcement
        const enfEmail = `test_enf_${Date.now()}@test.com`;
        const enfPhone = `88${Math.floor(Math.random() * 100000000)}`;
        const enfObj = await authService.register({
            firstName: "Enf", lastName: "Officer", email: enfEmail, phone: enfPhone,
            username: `enf_${Date.now()}`,
            password: "Password@123", userType: "ENFORCEMENT"
        });

        await authService.approveOfficer(enfObj.user._id, new mongoose.Types.ObjectId());
        const enfLogin = await authService.login(enfEmail, "Password@123", "ENFORCEMENT");

        const queueRes = await axios.get(`${BASE_URL}/officer/enforcement/applications/queue`, {
            headers: { Authorization: `Bearer ${enfLogin.token}` }
        });
        console.log("✅ getApprovalQueue alias:", queueRes.status, "status. Data length:", queueRes.data.data?.length || 0, "\n");

        console.log("🧹 Cleaning up...");
        await User.deleteMany({ email: { $in: [email, enfEmail] } });

        console.log("🎯 All tests completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Test Failed:", error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

testNewApis();
