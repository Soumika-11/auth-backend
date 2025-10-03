# 🚀 Complete API Testing Guide

**Authentication Backend - All Endpoints Reference**

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Admin Endpoints](#admin-endpoints)
4. [Testing Workflows](#testing-workflows)
5. [Error Responses](#error-responses)
6. [Security Testing](#security-testing)

---

## Quick Start

### Server Information
- **Base URL:** `http://localhost:4000`
- **Health Check:** `GET /health`
- **API Base:** `/api`

### Start Server
```bash
npm run dev
```

### Test Server
```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-10-03T15:15:55.912Z"
}
```

---

## Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Request:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass1!"
  }'
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (@$!%*?&)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "isVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

**What Happens:**
- ✅ Email normalized (lowercase, trimmed)
- ✅ Password hashed with bcrypt (10 salt rounds)
- ✅ User saved to MongoDB
- ✅ Access token generated (15min expiry)
- ✅ Refresh token generated (7d expiry)
- ✅ Refresh token stored in HttpOnly cookie + database

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass1!"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "isVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

**What Happens:**
- ✅ Credentials verified (email lookup + bcrypt comparison)
- ✅ New access token issued (15min)
- ✅ New refresh token issued (7d)
- ✅ Refresh token stored in cookie + database

---

### 3. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Request (with cookie):**
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b "refreshToken=eyJhbGc..."
```

**Request (without cookie - body fallback):**
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**What Happens:**
- ✅ Refresh token verified (JWT signature + expiry)
- ✅ Token existence verified in database
- ✅ Old refresh token removed from database
- ✅ New access token generated (15min)
- ✅ New refresh token generated (7d)
- ✅ Token rotation for security

---

### 4. Get User Profile 🔒

**Endpoint:** `GET /api/auth/profile`  
**Protected:** Requires authentication

**Request:**
```bash
curl -X GET http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "isVerified": false,
      "createdAt": "2025-10-03T15:07:40.148Z",
      "updatedAt": "2025-10-03T15:07:40.148Z"
    }
  }
}
```

---

### 5. Logout (Current Device) 🔒

**Endpoint:** `POST /api/auth/logout`  
**Protected:** Requires authentication

**Request:**
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -b "refreshToken=eyJhbGc..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

**What Happens:**
- ✅ Specific refresh token removed from database
- ✅ Refresh token cookie cleared
- ✅ Other devices remain logged in

---

### 6. Logout All Devices 🔒

**Endpoint:** `POST /api/auth/logout-all`  
**Protected:** Requires authentication

**Request:**
```bash
curl -X POST http://localhost:4000/api/auth/logout-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": null
}
```

**What Happens:**
- ✅ ALL refresh tokens removed from database
- ✅ User logged out from all devices

---

## Admin Endpoints

All admin endpoints require:
1. **Authentication:** Valid access token
2. **Authorization:** Admin role

### 1. Get Dashboard Statistics 👑

**Endpoint:** `GET /api/admin/dashboard`  
**Access:** Admin only

**Request:**
```bash
curl -X GET http://localhost:4000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "totalUsers": 10,
    "totalAdmins": 2,
    "totalRegularUsers": 8,
    "recentUsers": [...]
  }
}
```

---

### 2. Get All Users 👑

**Endpoint:** `GET /api/admin/users`  
**Access:** Admin only

**Request:**
```bash
curl -X GET http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "email": "user@example.com",
        "role": "user",
        "isVerified": false,
        "createdAt": "2025-10-03T15:07:40.148Z",
        "updatedAt": "2025-10-03T15:07:40.148Z"
      }
    ],
    "count": 10
  }
}
```

---

### 3. Get User by ID 👑

**Endpoint:** `GET /api/admin/users/:userId`  
**Access:** Admin only

**Request:**
```bash
curl -X GET http://localhost:4000/api/admin/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "isVerified": false,
      "createdAt": "2025-10-03T15:07:40.148Z"
    }
  }
}
```

---

### 4. Update User Role 👑

**Endpoint:** `PATCH /api/admin/users/:userId/role`  
**Access:** Admin only

**Request - Promote to Admin:**
```bash
curl -X PATCH http://localhost:4000/api/admin/users/507f1f77bcf86cd799439011/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

**Request - Demote to User:**
```bash
curl -X PATCH http://localhost:4000/api/admin/users/507f1f77bcf86cd799439011/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

**Security:**
- ❌ Cannot demote yourself
- ✅ Only 'user' or 'admin' roles allowed

---

### 5. Delete User 👑

**Endpoint:** `DELETE /api/admin/users/:userId`  
**Access:** Admin only

**Request:**
```bash
curl -X DELETE http://localhost:4000/api/admin/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

**Security:**
- ❌ Cannot delete yourself

---

## Testing Workflows

### Complete Registration & Login Flow

```bash
# 1. Register new user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass1!"
  }' | jq

# 2. Extract and save access token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass1!"
  }' | jq -r '.data.tokens.accessToken')

# 3. Get user profile
curl -X GET http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Logout
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

---

### Admin Testing Flow

```bash
# 1. Promote user to admin (using script)
npm run admin:set newuser@example.com

# 2. Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass1!"
  }' | jq -r '.data.tokens.accessToken')

# 3. Test admin endpoint
curl -X GET http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 4. Get dashboard stats
curl -X GET http://localhost:4000/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

### Token Refresh Flow

```bash
# 1. Login and save cookies
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass1!"
  }' -c cookies.txt -v

# 2. Use access token until it expires (15 minutes)

# 3. Refresh token using cookie
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt -c cookies.txt | jq

# 4. Use new access token
```

---

## Error Responses

### Validation Errors (400)

**Empty Body:**
```json
{
  "success": false,
  "message": "Request body is empty or invalid. Make sure Content-Type header is set to application/json",
  "errors": [
    {
      "path": "body",
      "message": "Request body is required"
    }
  ]
}
```

**Invalid Email:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Weak Password:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
    }
  ]
}
```

---

### Authentication Errors (401)

**No Token:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Invalid/Expired Token:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Invalid Credentials (Login):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Note:** Same message for both "email not found" and "wrong password" (security best practice)

---

### Authorization Errors (403)

**Insufficient Permissions:**
```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```

**Cannot Demote Self:**
```json
{
  "success": false,
  "message": "Cannot demote yourself"
}
```

**Cannot Delete Self:**
```json
{
  "success": false,
  "message": "Cannot delete yourself"
}
```

---

### Not Found Errors (404)

**User Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Route Not Found:**
```json
{
  "success": false,
  "message": "Route not found"
}
```

---

## Security Testing

### Test 1: User Enumeration Prevention

**Try to register with existing email:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "password": "SecurePass1!"
  }'
```

**Expected:** Generic message (no mention of "user exists")
```json
{
  "success": false,
  "message": "Unable to complete registration. Please try again or contact support."
}
```

---

### Test 2: Invalid Credentials

**Wrong email:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "SecurePass1!"
  }'
```

**Wrong password:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "password": "WrongPassword1!"
  }'
```

**Expected:** Same message for both
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Test 3: RBAC - Regular User Accessing Admin Route

```bash
# 1. Login as regular user
USER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "regularuser@example.com",
    "password": "SecurePass1!"
  }' | jq -r '.data.tokens.accessToken')

# 2. Try to access admin route
curl -X GET http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected (403 Forbidden):**
```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```

---

### Test 4: Expired Token

**Wait 15+ minutes after login, then try to use access token:**
```bash
curl -X GET http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**Expected (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## Quick Reference

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (registration) |
| 400 | Bad Request | Validation errors, malformed data |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource or route not found |
| 500 | Server Error | Unexpected server error |

---

### Authentication Header Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Content-Type Header

**Always include for POST/PATCH requests:**
```
Content-Type: application/json
```

---

## Automated Testing Scripts

### Run All Tests
```bash
# RBAC tests
./Test/test-rbac.sh

# Validation tests
./Test/test-validation.sh

# General API tests
./Test/test-api.sh
```

---

## Tips & Best Practices

1. **Always use HTTPS in production**
2. **Store access tokens in memory** (not localStorage - XSS risk)
3. **Let HttpOnly cookies handle refresh tokens**
4. **Include `credentials: 'include'` in fetch requests**
5. **Implement token refresh logic** before access token expires
6. **Use environment variables** for configuration
7. **Test error scenarios** not just happy paths
8. **Use `jq` for prettier JSON output** in terminal

---

## Support

For issues or questions:
- Check documentation in `Docs/` folder
- Review error messages carefully
- Test with curl before implementing in client
- Verify MongoDB connection and data

---

**🎉 Your API is ready for production!**
