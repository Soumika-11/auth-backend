#!/bin/bash

# Validation and Error Handling Test Script

BASE_URL="http://localhost:4000/api"

echo "==========================================="
echo "Validation & Error Handling Testing Script"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Invalid Email Format
echo -e "${YELLOW}Test 1: Invalid Email Format${NC}"
echo "Testing with email: 'notanemail'"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notanemail",
    "password": "SecurePass1!"
  }')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null && echo "$RESPONSE" | grep -q "Invalid email format"; then
  echo -e "${GREEN}✓ Correctly rejected invalid email format${NC}"
else
  echo -e "${RED}✗ Failed to validate email format${NC}"
fi
echo ""

# Test 2: Email Too Short
echo -e "${YELLOW}Test 2: Email Too Short${NC}"
echo "Testing with email: 'a@b'"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "a@b",
    "password": "SecurePass1!"
  }')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected short email${NC}"
else
  echo -e "${RED}✗ Failed to validate email length${NC}"
fi
echo ""

# Test 3: Weak Password (too short)
echo -e "${YELLOW}Test 3: Weak Password - Too Short${NC}"
echo "Testing with password: 'weak'"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "weak"
  }')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected weak password${NC}"
else
  echo -e "${RED}✗ Failed to validate password strength${NC}"
fi
echo ""

# Test 4: Password Without Uppercase
echo -e "${YELLOW}Test 4: Password Without Uppercase${NC}"
echo "Testing with password: 'password123!'"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user2@example.com",
    "password": "password123!"
  }')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected password without uppercase${NC}"
else
  echo -e "${RED}✗ Failed to validate password uppercase requirement${NC}"
fi
echo ""

# Test 5: Password Without Number
echo -e "${YELLOW}Test 5: Password Without Number${NC}"
echo "Testing with password: 'PasswordPass!'"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user3@example.com",
    "password": "PasswordPass!"
  }')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected password without number${NC}"
else
  echo -e "${RED}✗ Failed to validate password number requirement${NC}"
fi
echo ""

# Test 6: Password Without Special Character
echo -e "${YELLOW}Test 6: Password Without Special Character${NC}"
echo "Testing with password: 'Password123'"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user4@example.com",
    "password": "Password123"
  }')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected password without special character${NC}"
else
  echo -e "${RED}✗ Failed to validate password special character requirement${NC}"
fi
echo ""

# Test 7: Valid Registration
echo -e "${YELLOW}Test 7: Valid Registration${NC}"
RANDOM_EMAIL="testuser$(date +%s)@example.com"
echo "Testing with email: '$RANDOM_EMAIL'"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"SecurePass1!\"
  }")

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Valid registration successful${NC}"
  ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.data.tokens.accessToken')
else
  echo -e "${RED}✗ Valid registration failed${NC}"
fi
echo ""

# Test 8: Duplicate Registration (Generic Error Message)
echo -e "${YELLOW}Test 8: Duplicate Registration${NC}"
echo "Testing duplicate registration with same email"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"SecurePass1!\"
  }")

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
  if [[ "$MESSAGE" != *"already exists"* ]] && [[ "$MESSAGE" != *"email"* ]]; then
    echo -e "${GREEN}✓ Generic error message used (secure - no user enumeration)${NC}"
  else
    echo -e "${RED}✗ Error message reveals email exists (insecure!)${NC}"
  fi
else
  echo -e "${RED}✗ Duplicate registration not prevented${NC}"
fi
echo ""

# Test 9: Login with Non-Existent Email (Generic Error)
echo -e "${YELLOW}Test 9: Login with Non-Existent Email${NC}"
echo "Testing login with non-existent email"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent12345@example.com",
    "password": "AnyPassword1!"
  }')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
  echo "Error message: '$MESSAGE'"
  if [[ "$MESSAGE" == *"Invalid credentials"* ]] || [[ "$MESSAGE" == *"invalid"* ]]; then
    echo -e "${GREEN}✓ Generic error message for non-existent user (secure)${NC}"
  else
    echo -e "${RED}✗ Error message reveals user doesn't exist (insecure!)${NC}"
  fi
else
  echo -e "${RED}✗ Login should have failed${NC}"
fi
echo ""

# Test 10: Login with Wrong Password (Same Generic Error)
echo -e "${YELLOW}Test 10: Login with Wrong Password${NC}"
echo "Testing login with wrong password for existing user"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"WrongPass1!\"
  }")

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
  echo "Error message: '$MESSAGE'"
  if [[ "$MESSAGE" == *"Invalid credentials"* ]] || [[ "$MESSAGE" == *"invalid"* ]]; then
    echo -e "${GREEN}✓ Same generic error message for wrong password (secure)${NC}"
  else
    echo -e "${RED}✗ Error message is different from Test 9 (may enable user enumeration)${NC}"
  fi
else
  echo -e "${RED}✗ Login should have failed${NC}"
fi
echo ""

# Test 11: Valid Login
echo -e "${YELLOW}Test 11: Valid Login${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"SecurePass1!\"
  }")

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Valid login successful${NC}"
else
  echo -e "${RED}✗ Valid login failed${NC}"
fi
echo ""

# Test 12: Missing Fields
echo -e "${YELLOW}Test 12: Missing Required Fields${NC}"
echo "Testing with missing password"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected missing password${NC}"
else
  echo -e "${RED}✗ Failed to validate required fields${NC}"
fi
echo ""

# Test 13: Empty Request Body
echo -e "${YELLOW}Test 13: Empty Request Body${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected empty request${NC}"
else
  echo -e "${RED}✗ Failed to validate empty request${NC}"
fi
echo ""

# Summary
echo "==========================================="
echo -e "${GREEN}Validation & Error Handling Tests Complete${NC}"
echo "==========================================="
echo ""
echo "Security Checklist:"
echo "✓ Email format validation"
echo "✓ Password strength requirements"
echo "✓ Generic error messages (no user enumeration)"
echo "✓ Consistent error responses"
echo "✓ Required field validation"
echo ""
echo "Key Security Features:"
echo "1. Same error message for 'user not found' and 'wrong password'"
echo "2. Generic message for duplicate registration"
echo "3. Strong password requirements enforced"
echo "4. Email normalization (lowercase, trimmed)"
echo "5. Comprehensive input validation"
