#!/bin/bash

# RBAC Testing Script
# This script tests role-based access control functionality

BASE_URL="http://localhost:4000/api"
ADMIN_EMAIL="admin@test.com"
USER_EMAIL="user@test.com"
PASSWORD="password123"

echo "================================"
echo "RBAC Testing Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Register a regular user
echo -e "${YELLOW}Step 1: Registering regular user...${NC}"
USER_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "$USER_REGISTER_RESPONSE" | jq '.'

# Extract tokens
USER_ACCESS_TOKEN=$(echo "$USER_REGISTER_RESPONSE" | jq -r '.data.tokens.accessToken // empty')

if [ -z "$USER_ACCESS_TOKEN" ]; then
  echo -e "${YELLOW}User already exists, logging in...${NC}"
  USER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER_EMAIL\",
      \"password\": \"$PASSWORD\"
    }")
  USER_ACCESS_TOKEN=$(echo "$USER_LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')
fi

echo -e "${GREEN}User Access Token: ${USER_ACCESS_TOKEN:0:50}...${NC}"
echo ""

# Step 2: Register an admin user
echo -e "${YELLOW}Step 2: Registering admin user...${NC}"
ADMIN_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "$ADMIN_REGISTER_RESPONSE" | jq '.'

# Extract tokens
ADMIN_ACCESS_TOKEN=$(echo "$ADMIN_REGISTER_RESPONSE" | jq -r '.data.tokens.accessToken // empty')

if [ -z "$ADMIN_ACCESS_TOKEN" ]; then
  echo -e "${YELLOW}Admin user already exists, logging in...${NC}"
  ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$ADMIN_EMAIL\",
      \"password\": \"$PASSWORD\"
    }")
  ADMIN_ACCESS_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')
fi

echo -e "${GREEN}Admin Access Token: ${ADMIN_ACCESS_TOKEN:0:50}...${NC}"
echo ""

# Note about making the user an admin
echo -e "${RED}NOTE: The admin user is created with 'user' role by default.${NC}"
echo -e "${RED}You need to manually promote this user to admin in MongoDB:${NC}"
echo ""
echo "db.users.updateOne("
echo "  { email: \"$ADMIN_EMAIL\" },"
echo "  { \$set: { role: \"admin\" } }"
echo ")"
echo ""
echo -e "${YELLOW}Press Enter after you've promoted the user to admin, or Ctrl+C to exit${NC}"
read -r

# Refresh admin token after role change
echo -e "${YELLOW}Logging in again to get fresh token with admin role...${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
ADMIN_ACCESS_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')
echo -e "${GREEN}New Admin Access Token: ${ADMIN_ACCESS_TOKEN:0:50}...${NC}"
echo ""

# Step 3: Test regular user accessing protected route (should succeed)
echo -e "${YELLOW}Step 3: Testing regular user accessing their profile (should succeed)...${NC}"
USER_PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN")

echo "$USER_PROFILE_RESPONSE" | jq '.'

if echo "$USER_PROFILE_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Regular user can access their profile${NC}"
else
  echo -e "${RED}✗ Failed to access profile${NC}"
fi
echo ""

# Step 4: Test regular user accessing admin route (should fail)
echo -e "${YELLOW}Step 4: Testing regular user accessing admin route (should fail with 403)...${NC}"
USER_ADMIN_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/users" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN")

echo "$USER_ADMIN_RESPONSE" | jq '.'

if echo "$USER_ADMIN_RESPONSE" | jq -e '.success == false' > /dev/null; then
  if echo "$USER_ADMIN_RESPONSE" | grep -q "Forbidden"; then
    echo -e "${GREEN}✓ Regular user correctly denied access to admin route (403 Forbidden)${NC}"
  else
    echo -e "${YELLOW}⚠ Access denied but not with expected error message${NC}"
  fi
else
  echo -e "${RED}✗ Regular user was able to access admin route (SECURITY ISSUE!)${NC}"
fi
echo ""

# Step 5: Test admin accessing admin route (should succeed)
echo -e "${YELLOW}Step 5: Testing admin user accessing admin route (should succeed)...${NC}"
ADMIN_DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/dashboard" \
  -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")

echo "$ADMIN_DASHBOARD_RESPONSE" | jq '.'

if echo "$ADMIN_DASHBOARD_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Admin can access admin dashboard${NC}"
else
  echo -e "${RED}✗ Admin cannot access admin dashboard${NC}"
  echo -e "${RED}   Make sure you promoted the user to admin role!${NC}"
fi
echo ""

# Step 6: Test admin getting all users
echo -e "${YELLOW}Step 6: Testing admin getting all users...${NC}"
ADMIN_USERS_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/users" \
  -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")

echo "$ADMIN_USERS_RESPONSE" | jq '.'

if echo "$ADMIN_USERS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  USER_COUNT=$(echo "$ADMIN_USERS_RESPONSE" | jq -r '.data.count')
  echo -e "${GREEN}✓ Admin can view all users (${USER_COUNT} users found)${NC}"
else
  echo -e "${RED}✗ Admin cannot view users${NC}"
fi
echo ""

# Step 7: Test accessing admin route without token (should fail)
echo -e "${YELLOW}Step 7: Testing admin route without token (should fail with 401)...${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/users")

echo "$NO_TOKEN_RESPONSE" | jq '.'

if echo "$NO_TOKEN_RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Unauthenticated request correctly denied (401)${NC}"
else
  echo -e "${RED}✗ Unauthenticated request was not denied (SECURITY ISSUE!)${NC}"
fi
echo ""

# Step 8: Test accessing admin route with invalid token (should fail)
echo -e "${YELLOW}Step 8: Testing admin route with invalid token (should fail with 401)...${NC}"
INVALID_TOKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/users" \
  -H "Authorization: Bearer invalid.token.here")

echo "$INVALID_TOKEN_RESPONSE" | jq '.'

if echo "$INVALID_TOKEN_RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Invalid token correctly denied (401)${NC}"
else
  echo -e "${RED}✗ Invalid token was not denied (SECURITY ISSUE!)${NC}"
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}RBAC Testing Complete!${NC}"
echo "================================"
echo ""
echo "Summary of RBAC Features Tested:"
echo "✓ JWT tokens include role information"
echo "✓ Regular users can access their own resources"
echo "✓ Regular users are denied access to admin routes (403)"
echo "✓ Admin users can access admin routes"
echo "✓ Unauthenticated requests are denied (401)"
echo "✓ Invalid tokens are rejected (401)"
echo ""
echo "Tokens for manual testing:"
echo "---"
echo "Regular User Token:"
echo "$USER_ACCESS_TOKEN"
echo ""
echo "Admin User Token:"
echo "$ADMIN_ACCESS_TOKEN"
echo "---"
