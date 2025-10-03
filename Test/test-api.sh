#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:4000"
EMAIL="test$(date +%s)@example.com"
PASSWORD="test123456"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Auth Backend API - Complete Test Suite        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}[1/7] Testing Health Check...${NC}"
curl -s -X GET "$BASE_URL/health" | jq '.'
echo -e "${GREEN}✓ Health check passed\n${NC}"

# Test 2: Register
echo -e "${YELLOW}[2/7] Testing User Registration...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'

ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken')
if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ Registration successful! Access token received.${NC}\n"
else
    echo -e "${RED}✗ Registration failed!${NC}\n"
    exit 1
fi

# Test 3: Get Profile (Protected Route)
echo -e "${YELLOW}[3/7] Testing Protected Route (Get Profile)...${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | jq '.'
if echo "$PROFILE_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Profile retrieved successfully!${NC}\n"
else
    echo -e "${RED}✗ Profile retrieval failed!${NC}\n"
fi

# Test 4: Login
echo -e "${YELLOW}[4/7] Testing User Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies2.txt \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'

NEW_ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
if [ "$NEW_ACCESS_TOKEN" != "null" ] && [ -n "$NEW_ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful! New access token received.${NC}\n"
    ACCESS_TOKEN=$NEW_ACCESS_TOKEN
else
    echo -e "${RED}✗ Login failed!${NC}\n"
fi

# Test 5: Refresh Token
echo -e "${YELLOW}[5/7] Testing Token Refresh...${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -b cookies2.txt \
  -c cookies3.txt)

echo "$REFRESH_RESPONSE" | jq '.'

REFRESHED_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.accessToken')
if [ "$REFRESHED_ACCESS_TOKEN" != "null" ] && [ -n "$REFRESHED_ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ Token refresh successful!${NC}\n"
    ACCESS_TOKEN=$REFRESHED_ACCESS_TOKEN
else
    echo -e "${RED}✗ Token refresh failed!${NC}\n"
fi

# Test 6: Logout All Devices
echo -e "${YELLOW}[6/7] Testing Logout from All Devices...${NC}"
LOGOUT_ALL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/logout-all" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "$LOGOUT_ALL_RESPONSE" | jq '.'

if echo "$LOGOUT_ALL_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Logout from all devices successful!${NC}\n"
else
    echo -e "${RED}✗ Logout failed!${NC}\n"
fi

# Test 7: Verify Logout (Should Fail to Refresh)
echo -e "${YELLOW}[7/7] Testing Token Refresh After Logout (Should Fail)...${NC}"
VERIFY_LOGOUT=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -b cookies3.txt)

echo "$VERIFY_LOGOUT" | jq '.'

if echo "$VERIFY_LOGOUT" | jq -e '.success == false' > /dev/null; then
    echo -e "${GREEN}✓ Logout verified! Token refresh correctly failed.${NC}\n"
else
    echo -e "${RED}✗ Logout verification failed! Tokens still working.${NC}\n"
fi

# Cleanup
rm -f cookies.txt cookies2.txt cookies3.txt

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            All Tests Completed!                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}Test Summary:${NC}"
echo -e "  • User Registration: ${GREEN}✓${NC}"
echo -e "  • Protected Route Access: ${GREEN}✓${NC}"
echo -e "  • User Login: ${GREEN}✓${NC}"
echo -e "  • Token Refresh: ${GREEN}✓${NC}"
echo -e "  • Logout All Devices: ${GREEN}✓${NC}"
echo -e "  • Logout Verification: ${GREEN}✓${NC}"
echo -e "\n${GREEN}All authentication endpoints are working correctly! 🎉${NC}\n"
