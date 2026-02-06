#!/bin/bash

BASE_URL="http://localhost:5000/api/noc/exemption/check-eligibility"

echo "==========================================="
echo "Testing Exemption Eligibility API"
echo "==========================================="

echo "1. Testing exempt case: Agriculture"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Agriculture Activities",
  "groundWaterUtilizationFor": "Agriculture",
  "agriculturalDetails": {
    "waterRequirementKLD": 20.0
  }
}' | python -m json.tool

echo ""
echo "-------------------------------------------"
echo "2. Testing exempt case: Domestic Individual (<= 5 KLD)"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Individual Domestic Use",
  "groundWaterUtilizationFor": "Drinking/Domestic",
  "dailyWaterRequirement": 4.5
}' | python -m json.tool

echo ""
echo "-------------------------------------------"
echo "3. Testing NON-exempt case: Industry (Banned)"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Industrial Use",
  "groundWaterUtilizationFor": "Industry",
  "industryType": "Textile",
  "dailyWaterRequirement": 10.0
}' | python -m json.tool

echo ""
echo "-------------------------------------------"
echo "4. Testing exempt case: MSME Small (< 10 KLD)"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Industrial Use",
  "groundWaterUtilizationFor": "Industry",
  "isMSME": "Yes",
  "msmeType": "Small",
  "dailyWaterRequirement": 8.0
}' | python -m json.tool

echo ""
echo "-------------------------------------------"
echo "5. Testing NON-exempt case: MSME (> 10 KLD)"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Industrial Use",
  "groundWaterUtilizationFor": "Industry",
  "isMSME": "Yes",
  "msmeType": "Small",
  "dailyWaterRequirement": 15.0
}' | python -m json.tool

echo ""
echo "-------------------------------------------"
echo "6. Testing NON-exempt case: Packaged Drinking Water (Even if MSME)"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
  "applicationType": "Industrial Use",
  "groundWaterUtilizationFor": "Industry",
  "industryType": "Packaged Drinking Water",
  "isMSME": "Yes",
  "msmeType": "Micro",
  "dailyWaterRequirement": 5.0
}' | python -m json.tool
