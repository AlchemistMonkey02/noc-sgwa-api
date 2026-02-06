
# 1. Create Application (Success)
curl -X POST http://localhost:5000/api/noc/exemption \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Agriculture Activities",
  "applicationSubType": "Ground Water Requirement for Agriculture",
  "groundWaterRequirementFor": "Agricultural draft",
  "waterQualityType": "Fresh Water",
  "applicationForBoring": "New Project",
  "dateOfBoring": "2026-02-01",
  "groundWaterUsage": {
    "drinkingDomestic": true,
    "agricultureUse": true
  },
  "ownerDetails": {
    "ownerName": "Saket Hospital",
    "ownerPhone": "9314887830",
    "ownerEmail": "sakethospitaljaipur@gmail.com",
    "ownerAddress": "Sector 10, Meera Marg, Agrawal Farm, Mansarovar",
    "state": "RAJASTHAN",
    "district": "JAIPUR",
    "pinCode": "302020"
  },
  "agriculturalDetails": {
    "state": "RAJASTHAN",
    "district": "JAIPUR",
    "assessmentUnitBlockTehsil": "AMBER (Status: OVER EXPLOITED)",
    "address": "Jaipur",
    "pinCode": "302017",
    "landHoldingAreaHectare": 23.0,
    "landDetailsKhasraNo": "23",
    "gramPanchayatName": "23",
    "waterRequirementKLD": 23.0
  }
}'

# 2. Create Application (Failed - Not Eligible due to Not Agriculture)
curl -X POST http://localhost:5000/api/noc/exemption \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Industrial Use", 
  "waterQualityType": "Fresh Water",
  "ownerDetails": { "ownerName": "Test" }
}'

# 3. Create Application (Failed - Over Limit in Over Exploited)
curl -X POST http://localhost:5000/api/noc/exemption \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Agriculture Activities",
  "waterQualityType": "Fresh Water",
  "agriculturalDetails": {
    "assessmentUnitBlockTehsil": "AMBER (Status: OVER EXPLOITED)",
    "waterRequirementKLD": 60.0
  },
   "ownerDetails": { "ownerName": "Test" }
}'
