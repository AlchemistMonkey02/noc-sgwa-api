
async function testCompanyRegistration() {
    const baseUrl = 'http://localhost:3000/api/auth';

    const companyUser = {
        applicantInfo: {
            title: "Mr",
            applicantName: "Test Company User",
            dateOfBirth: "1990-01-01",
            gender: "MALE",
            uid: "123456789099",
            idProofType: "PAN",
            idProofNumber: "ABCDE1234G",
            mobileNumber: "9876543210",
            emailId: "company@example.com",
        },
        communicationAddress: {
            addressLine1: "123 Biz Park",
            addressLine2: "Sector 5",
            state: "Rajasthan",
            district: "Jaipur",
            pincode: "302020"
        },
        loginCredentials: {
            preferredUsername: "companyuser001",
            password: "SecurePass@123",
            securityQuestion: "Pet",
            securityAnswer: "Dog"
        },
        organizationDetails: {
            organizationName: "Test Company Ltd",
            organizationType: "COMPANY"
        },
        userType: "APPLICANT",
        declaration: true
    };

    console.log("Testing Company Registration...");

    try {
        const res = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyUser)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            console.log("✅ Registration Successful");
            console.log("Response Message:", data.message);

            // Now we need to verify if the user actually has organization details.
            // Since the API doesn't return them, we will try to login and see IF we were able to login (which we should be able to).
            // But to verify the Fields, we'd need to inspect the DB or have an endpoint.
            // Let's assume for now that if I can't check it easily, I rely on code inspection which I already did.
            // Code inspection showed it is NOT mapped.
            // So this test is mainly to confirm the request doesn't crash and to provide a base for verification later.

        } else {
            console.log("❌ Registration Failed:", JSON.stringify(data));
        }
    } catch (error) {
        console.log("❌ Registration Failed:", error.message);
    }
}

testCompanyRegistration();
