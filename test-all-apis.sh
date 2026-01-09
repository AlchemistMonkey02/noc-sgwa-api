#!/bin/bash

# SGWA API - Complete Testing Script
# Tests all major API endpoints

BASE_URL="http://localhost:3000"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 SGWA API - Complete Testing Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echoo "⚠️  jq is not installed. Install it for better output formatting."
    echo "   Ubuntu/Debian: sudo apt-get install jq"
    echo "   macOS: brew install jq"
    exit 1
fi

# Test counters
PASSED=0
FAILED=0

test_api() {
    local name=$1
    local response=$2
    local expected=$3
    
    if echo "$response" | jq -e "$expected" > /dev/null 2>&1; then
        echo "✅ $name"
        ((PASSED++))
    else
        echo "❌ $name"
        ((FAILED++))
    fi
}

echo ""
echo "📊 1. Testing Master Data APIs (Public)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATES=$(curl -s "$BASE_URL/api/master/states")
test_api "Get States" "$STATES" '.success == true'

DISTRICTS=$(curl -s "$BASE_URL/api/master/districts?stateId=RAJ")
test_api "Get Districts" "$DISTRICTS" '.success == true'

echo ""
echo "🔐 2. Testing Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Login
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"applicant@test.com","password":"Password@123"}')

test_api "Login" "$LOGIN_RESPONSE" '.success == true'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "❌ Failed to get authentication token. Exiting."
    exit 1
fi

echo "   Token: ${TOKEN:0:30}..."

# Get Profile
PROFILE=$(curl -s "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN")
test_api "Get Profile" "$PROFILE" '.success == true'

echo ""
echo "🏢 3. Testing Company APIs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get Companies
COMPANIES=$(curl -s "$BASE_URL/api/companies" \
  -H "Authorization: Bearer $TOKEN")
test_api "Get Companies" "$COMPANIES" '.success == true'

COMPANY_ID=$(echo "$COMPANIES" | jq -r '.data[0].companyId')
echo "   Company ID: $COMPANY_ID"

# Get Company Stats
STATS=$(curl -s "$BASE_URL/api/companies/stats" \
  -H "Authorization: Bearer $TOKEN")
test_api "Get Company Stats" "$STATS" '.success == true'

echo ""
echo "📝 4. Testing NOC Application APIs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create NOC Application
CREATE_APP=$(curl -s -X POST "$BASE_URL/api/applications/noc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"companyId\":\"$COMPANY_ID\",\"applicationType\":\"NEW\",\"sectorType\":\"INDUSTRIAL\"}")

test_api "Create NOC Application" "$CREATE_APP" '.success == true'

APP_ID=$(echo "$CREATE_APP" | jq -r '.data.applicationId')
echo "   Application ID: $APP_ID"

# Get Applications
APPS=$(curl -s "$BASE_URL/api/applications/noc" \
  -H "Authorization: Bearer $TOKEN")
test_api "Get Applications" "$APPS" '.success == true'

# Get Application by ID
APP_DETAIL=$(curl -s "$BASE_URL/api/applications/noc/$APP_ID" \
  -H "Authorization: Bearer $TOKEN")
test_api "Get Application Detail" "$APP_DETAIL" '.success == true'

# Calculate Fees
FEES=$(curl -s "$BASE_URL/api/applications/noc/$APP_ID/calculate-fees" \
  -H "Authorization: Bearer $TOKEN")
test_api "Calculate Fees" "$FEES" '.success == true'

echo ""
echo "🔔 5. Testing Notification APIs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get Notifications
NOTIFS=$(curl -s "$BASE_URL/api/notifications" \
  -H "Authorization: Bearer $TOKEN")
test_api "Get Notifications" "$NOTIFS" '.success == true'

# Get Unread Count
UNREAD=$(curl -s "$BASE_URL/api/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN")
test_api "Get Unread Count" "$UNREAD" '.success == true'

echo ""
echo "🔢 6. Testing Calculator APIs (Public)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Fee Calculator
FEE_CALC=$(curl -s -X POST "$BASE_URL/api/tools/fee-calculator" \
  -H "Content-Type: application/json" \
  -d '{"applicationType":"NEW_NOC","waterRequirement":50,"blockCategory":"SAFE"}')
test_api "Fee Calculator" "$FEE_CALC" '.success == true'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "📝 Total:  $((PASSED + FAILED))"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Check the output above."
    exit 1
fi
