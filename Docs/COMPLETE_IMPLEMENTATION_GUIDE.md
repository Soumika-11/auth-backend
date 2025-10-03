# 🏗️ Complete Implementation & Logic Guide

**Authentication Backend - Architecture, Security, and Implementation Details**

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Authentication Flow](#authentication-flow)
3. [Role-Based Access Control (RBAC)](#role-based-access-control)
4. [Security Implementation](#security-implementation)
5. [Validation & Error Handling](#validation--error-handling)
6. [Token Management](#token-management)
7. [Code Structure](#code-structure)

---

## System Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          CLIENT                              │
│                    (Web/Mobile App)                          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Request
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     EXPRESS SERVER                           │
│                    (Port 4000)                               │
├─────────────────────────────────────────────────────────────┤
│  Middleware Chain:                                           │
│  1. express.json()        - Parse JSON bodies               │
│  2. cookieParser()        - Parse cookies                    │
│  3. validate()           - Input validation (Zod)           │
│  4. authenticate()       - JWT verification                  │
│  5. authorize()          - Role checking                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                        ROUTES                                │
│                  (src/routes/*.ts)                          │
│  • Define endpoints                                          │
│  • Apply middleware                                          │
│  • Route to controllers                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLERS                              │
│              (src/controllers/*.ts)                         │
│  • Handle HTTP request/response                              │
│  • Extract request data                                      │
│  • Call service layer                                        │
│  • Return formatted response                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      SERVICES                                │
│               (src/services/*.ts)                           │
│  • Business logic                                            │
│  • Database operations                                       │
│  • Token generation                                          │
│  • Data validation                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                       MODELS                                 │
│                (src/models/*.ts)                            │
│  • Schema definition                                         │
│  • Data validation                                           │
│  • Pre/post hooks                                            │
│  • Methods                                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                          │
│                   (MongoDB Atlas)                           │
│  • User collection                                           │
│  • Persistent storage                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### 1. Registration Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/auth/register
     │ { email, password }
     ↓
┌────────────────┐
│  Validation    │ ← Zod Schema
│  Middleware    │   • Email format
└────┬───────────┘   • Password strength
     │ ✓ Valid
     ↓
┌────────────────┐
│  Auth          │
│  Controller    │
└────┬───────────┘
     │ register(email, password)
     ↓
┌────────────────┐
│  Auth          │ 1. Check if email exists
│  Service       │ 2. If exists → throw error (generic message)
└────┬───────────┘ 3. Create user (password auto-hashed)
     │             4. Generate access token (15min)
     │             5. Generate refresh token (7d)
     │             6. Save refresh token to DB
     │             7. Return user + tokens
     ↓
┌────────────────┐
│  User Model    │ Pre-save Hook:
│  (Mongoose)    │ • Hash password with bcrypt (10 rounds)
└────┬───────────┘ • Save to MongoDB
     │
     ↓
┌────────────────┐
│  MongoDB       │ User document created:
│  Database      │ {
└────────────────┘   _id, email, password (hashed),
                     role: 'user', refreshTokens: [],
                     isVerified: false, timestamps
                   }
     │
     ↓ Response
┌────────────────┐
│  Controller    │ • Set refresh token in HttpOnly cookie
└────┬───────────┘ • Return access token in body
     │
     ↓
┌──────────┐
│  Client  │ Receives:
└──────────┘ • Access token (store in memory)
             • Refresh token (automatic cookie)
```

---

### 2. Login Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/auth/login
     │ { email, password }
     ↓
┌────────────────┐
│  Validation    │ ← Email format + password presence
│  Middleware    │
└────┬───────────┘
     │ ✓ Valid
     ↓
┌────────────────┐
│  Auth          │
│  Controller    │
└────┬───────────┘
     │ login(email, password)
     ↓
┌────────────────┐
│  Auth          │ 1. Find user by email
│  Service       │    • select('+password') to include hashed password
└────┬───────────┘ 2. Verify password
     │               • bcrypt.compare(input, stored)
     │             3. IMPORTANT: Generic error if either fails
     │                "Invalid credentials" (not "email not found" or "wrong password")
     │             4. Generate new access token (15min)
     │             5. Generate new refresh token (7d)
     │             6. Save refresh token to DB
     │             7. Return user + tokens
     ↓
     │
     ↓ Response
┌────────────────┐
│  Controller    │ • Set refresh token in HttpOnly cookie
└────┬───────────┘ • Return access token in body
     │
     ↓
┌──────────┐
│  Client  │ Receives:
└──────────┘ • Access token (store in memory)
             • Refresh token (automatic cookie)
             • User info (email, role, etc.)
```

**Security Note:** Login uses the same error message for both "user not found" and "wrong password" to prevent user enumeration attacks.

---

### 3. Protected Route Access Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ GET /api/auth/profile
     │ Headers: { Authorization: "Bearer <token>" }
     ↓
┌────────────────────────────────────┐
│  Authenticate Middleware           │
├────────────────────────────────────┤
│  1. Extract token from header      │
│     • Check "Authorization" header │
│     • Verify "Bearer " prefix      │
│     • Extract token                │
│                                    │
│  2. Verify JWT token               │
│     • verifyAccessToken(token)     │
│     • Check signature              │
│     • Check expiry                 │
│     • Decode payload               │
│                                    │
│  3. Fetch user from database       │
│     • User.findById(payload.userId)│
│     • Get current user data        │
│                                    │
│  4. Attach to request              │
│     • req.user = user              │
└────┬───────────────────────────────┘
     │ ✓ Authenticated
     ↓
┌────────────────┐
│  Controller    │ • Access req.user safely
└────┬───────────┘ • Process request
     │             • Return response
     ↓
┌──────────┐
│  Client  │ Receives user data
└──────────┘
```

---

### 4. Token Refresh Flow

```
┌──────────┐
│  Client  │ Access token expired (after 15 min)
└────┬─────┘
     │ POST /api/auth/refresh
     │ Cookie: refreshToken=<token>
     ↓
┌────────────────┐
│  Auth          │
│  Controller    │ 1. Read refresh token from:
└────┬───────────┘    • HttpOnly cookie (preferred)
     │                • Request body (fallback)
     │
     ↓
┌────────────────┐
│  Auth          │ 1. Verify refresh token
│  Service       │    • JWT signature check
└────┬───────────┘    • Expiry check
     │             2. Find user
     │             3. Verify token exists in DB
     │             4. Remove old refresh token from DB
     │             5. Generate new access token (15min)
     │             6. Generate new refresh token (7d)
     │             7. Save new refresh token to DB
     │             8. Return new tokens
     ↓
┌────────────────┐
│  Controller    │ • Set new refresh token in cookie
└────┬───────────┘ • Return new access token
     │
     ↓
┌──────────┐
│  Client  │ Receives new tokens
└──────────┘ • Update access token
             • Refresh token auto-updated in cookie
```

**Key Point:** Token rotation - old refresh token is deleted, new one is created. This prevents token reuse attacks.

---

## Role-Based Access Control (RBAC)

### RBAC Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                           │
│  GET /api/admin/users                                        │
│  Authorization: Bearer <token>                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│           STEP 1: AUTHENTICATE MIDDLEWARE                    │
├─────────────────────────────────────────────────────────────┤
│  1. Extract & verify JWT token                               │
│  2. Decode payload: { userId, email, role }                  │
│  3. Fetch user from database                                 │
│  4. Attach to request: req.user = user                       │
│                                                              │
│  Errors:                                                     │
│  • No token → 401 "No token provided"                        │
│  • Invalid token → 401 "Invalid or expired token"            │
│  • User not found → 401 "User not found"                     │
└────────────────────────┬────────────────────────────────────┘
                         │ ✓ req.user exists
                         ↓
┌─────────────────────────────────────────────────────────────┐
│           STEP 2: AUTHORIZE MIDDLEWARE                       │
│                  authorize('admin')                          │
├─────────────────────────────────────────────────────────────┤
│  1. Check if req.user exists                                 │
│     • If not → 401 "Unauthorized"                            │
│                                                              │
│  2. Check if req.user.role matches allowed roles             │
│     • If 'admin' matches 'admin' → ✓ ALLOW                   │
│     • If 'user' doesn't match 'admin' → ✗ DENY (403)        │
│                                                              │
│  3. Can check multiple roles:                                │
│     • authorize('admin', 'moderator')                        │
│     • Allows if user has ANY of the roles                    │
│                                                              │
│  Errors:                                                     │
│  • Wrong role → 403 "Forbidden: Insufficient permissions"    │
└────────────────────────┬────────────────────────────────────┘
                         │ ✓ Role authorized
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              STEP 3: CONTROLLER/HANDLER                      │
├─────────────────────────────────────────────────────────────┤
│  async getAllUsers(req: AuthRequest, res: Response) {        │
│    // req.user is guaranteed to:                             │
│    // 1. Exist                                               │
│    // 2. Have 'admin' role                                   │
│    const users = await User.find();                          │
│    return ApiResponse.success(res, { users });               │
│  }                                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSE TO CLIENT                        │
│  200 OK { success: true, data: { users: [...] } }           │
└─────────────────────────────────────────────────────────────┘
```

---

### JWT Token Structure with Role

```javascript
// JWT Payload
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "admin@example.com",
  "role": "admin",              // ← Role included
  "iat": 1696377600,            // Issued at
  "exp": 1696378500             // Expires at
}
```

**When is role checked?**
1. **Token Generation:** Role is fetched from database and included in JWT
2. **Token Verification:** Role is decoded from JWT payload
3. **Authorization:** `authorize()` middleware checks decoded role
4. **Database Sync:** Fresh user data (including current role) is fetched during authentication

---

### Role Management

**Available Roles:**
```typescript
type UserRole = 'user' | 'admin';

// Default role
role: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user'
}
```

**How to Set Admin Role:**

1. **Via Script (Easiest):**
```bash
npm run admin:set user@example.com
```

2. **Via API (Requires existing admin):**
```bash
curl -X PATCH http://localhost:4000/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

3. **Directly in MongoDB:**
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

---

## Security Implementation

### 1. Password Security

**Hashing Implementation:**
```typescript
// User Model - Pre-save Hook
userSchema.pre('save', async function (next) {
    // Only hash if password is modified
    if (!this.isModified('password')) return next();

    try {
        // Generate salt (10 rounds)
        const salt = await bcrypt.genSalt(10);
        
        // Hash password
        this.password = await bcrypt.hash(this.password, salt);
        
        next();
    } catch (error: any) {
        next(error);
    }
});
```

**Password Comparison:**
```typescript
// User Model - Method
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};
```

**Security Features:**
- ✅ Passwords never stored in plain text
- ✅ 10 salt rounds (industry standard)
- ✅ Automatic hashing on save
- ✅ Secure comparison function
- ✅ Password field excluded from queries by default

---

### 2. JWT Token Security

**Token Generation:**
```typescript
// Generate Access Token (15 minutes)
const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
        expiresIn: config.ACCESS_TOKEN_EXPIRES
    });
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
        expiresIn: config.REFRESH_TOKEN_EXPIRES
    });
};
```

**Token Verification:**
```typescript
// Verify Access Token
const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
};

// Verify Refresh Token
const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
};
```

**Security Features:**
- ✅ Separate secrets for access and refresh tokens
- ✅ Short-lived access tokens (15 minutes)
- ✅ Longer-lived refresh tokens (7 days)
- ✅ Automatic expiry checking
- ✅ Signature verification prevents tampering

---

### 3. Cookie Security

**Configuration:**
```typescript
// Cookie Settings (from config.ts)
COOKIE: {
    REFRESH_TOKEN_NAME: 'refreshToken',
    MAX_AGE: 7 * 24 * 60 * 60 * 1000,  // 7 days
    HTTP_ONLY: true,                    // Prevents JavaScript access
    SECURE: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    SAME_SITE: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
}
```

**Setting Cookie:**
```typescript
// In controller
res.cookie(config.COOKIE.REFRESH_TOKEN_NAME, tokens.refreshToken, {
    httpOnly: config.COOKIE.HTTP_ONLY,
    secure: config.COOKIE.SECURE,
    sameSite: config.COOKIE.SAME_SITE as 'strict' | 'lax' | 'none',
    maxAge: config.COOKIE.MAX_AGE,
});
```

**Security Features:**
- ✅ **HttpOnly:** JavaScript cannot access (XSS protection)
- ✅ **Secure:** HTTPS only in production
- ✅ **SameSite:** CSRF protection
- ✅ **Max-Age:** Automatic expiration

---

### 4. Prevention of User Enumeration

**Registration - Generic Error:**
```typescript
// ❌ BAD - Reveals email exists
if (existingUser) {
    throw new AppError('User already exists with this email', 400);
}

// ✅ GOOD - Generic message
if (existingUser) {
    throw new AppError(
        'Unable to complete registration. Please try again or contact support.',
        400
    );
}
```

**Login - Same Error for Both Cases:**
```typescript
// ❌ BAD - Reveals which part failed
if (!user) {
    throw new AppError('Email not found', 401);
}
if (!isPasswordValid) {
    throw new AppError('Wrong password', 401);
}

// ✅ GOOD - Same message
if (!user || !isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
}
```

**Why This Matters:**
- Attackers cannot determine which emails are registered
- Prevents targeted attacks on known accounts
- Industry standard security practice
- Recommended by OWASP

---

### 5. Token Revocation

**Refresh Token Storage:**
```typescript
// User Model
refreshTokens: {
    type: [String],
    default: [],
    select: false  // Not included in queries by default
}
```

**Adding Token on Login:**
```typescript
// In auth service
user.refreshTokens.push(refreshToken);
await user.save();
```

**Removing Token on Logout:**
```typescript
// Single device logout
user.refreshTokens = user.refreshTokens.filter(
    (token) => token !== refreshToken
);
await user.save();

// All devices logout
user.refreshTokens = [];
await user.save();
```

**Benefits:**
- ✅ Immediate token revocation
- ✅ Logout from specific devices
- ✅ Logout from all devices
- ✅ Prevents use of stolen tokens after logout

---

## Validation & Error Handling

### Input Validation with Zod

**Email Validation:**
```typescript
export const emailSchema = z
    .string()
    .email('Invalid email format')
    .min(3, 'Email must be at least 3 characters')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()   // Normalize to lowercase
    .trim();         // Remove whitespace
```

**Strong Password Validation:**
```typescript
const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const strongPasswordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
        passwordStrengthRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    );
```

**Validation Middleware:**
```typescript
export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if body exists
            if (!req.body || Object.keys(req.body).length === 0) {
                return ApiResponse.error(
                    res,
                    'Request body is empty or invalid. Make sure Content-Type header is set to application/json',
                    400,
                    [{ path: 'body', message: 'Request body is required' }]
                );
            }

            // Validate with Zod
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));
                return ApiResponse.error(res, 'Validation failed', 400, errors);
            }
            return ApiResponse.error(res, 'Validation failed', 400);
        }
    };
};
```

---

### Centralized Error Handling

**AppError Class:**
```typescript
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;  // Known errors vs unexpected
        Error.captureStackTrace(this, this.constructor);
    }
}
```

**AsyncHandler Wrapper:**
```typescript
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
```

**Error Handler Middleware:**
```typescript
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return ApiResponse.error(res, 'Invalid token', 401);
    }
    if (err.name === 'TokenExpiredError') {
        return ApiResponse.error(res, 'Token expired', 401);
    }

    // Mongoose duplicate key error
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        return ApiResponse.error(
            res,
            'Unable to complete registration. Please try again or contact support.',
            409
        );
    }

    // AppError (known errors)
    if (err instanceof AppError) {
        return ApiResponse.error(res, err.message, err.statusCode);
    }

    // Unknown errors
    console.error('ERROR:', err);
    return ApiResponse.error(res, 'Internal server error', 500);
};
```

**Usage in Controllers:**
```typescript
// No try-catch needed!
register = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const { user, tokens } = await authService.register(email, password);
    return ApiResponse.success(res, { user, tokens }, 'User registered successfully', 201);
});
```

---

## Token Management

### Access Token Lifecycle

```
┌─────────────────────────────────────────────────────┐
│              ACCESS TOKEN LIFECYCLE                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. GENERATION (Login/Register/Refresh)              │
│     • Payload: { userId, email, role }               │
│     • Signed with JWT_ACCESS_SECRET                  │
│     • Expiry: 15 minutes                             │
│                                                      │
│  2. STORAGE (Client)                                 │
│     • Store in memory (React state, Vuex, etc.)      │
│     • Or sessionStorage (better than localStorage)   │
│     • ❌ NOT in localStorage (XSS risk)              │
│                                                      │
│  3. USAGE (API Requests)                             │
│     • Include in Authorization header                │
│     • Format: "Bearer <token>"                       │
│     • Server verifies on each request                │
│                                                      │
│  4. EXPIRATION (After 15 minutes)                    │
│     • Server returns 401 error                       │
│     • Client triggers refresh flow                   │
│     • Get new access token                           │
│                                                      │
│  5. REVOCATION                                       │
│     • Not stored in database                         │
│     • Cannot be explicitly revoked                   │
│     • Short expiry limits damage                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Refresh Token Lifecycle

```
┌─────────────────────────────────────────────────────┐
│             REFRESH TOKEN LIFECYCLE                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. GENERATION (Login/Register/Refresh)              │
│     • Payload: { userId, email, role }               │
│     • Signed with JWT_REFRESH_SECRET                 │
│     • Expiry: 7 days                                 │
│                                                      │
│  2. STORAGE                                          │
│     • Server: MongoDB (user.refreshTokens array)     │
│     • Client: HttpOnly cookie (automatic)            │
│     • ❌ NOT accessible via JavaScript               │
│                                                      │
│  3. USAGE (Token Refresh)                            │
│     • Automatically sent with refresh request        │
│     • Server verifies JWT + checks database          │
│     • Old token deleted, new one generated           │
│                                                      │
│  4. EXPIRATION (After 7 days)                        │
│     • JWT verification fails                         │
│     • User must login again                          │
│     • Token rotation prevents reuse                  │
│                                                      │
│  5. REVOCATION                                       │
│     • Logout: Remove from database                   │
│     • Logout All: Remove all user's tokens           │
│     • Immediate revocation possible                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Token Rotation Strategy

```
Login/Refresh Request
        ↓
┌──────────────────────┐
│ Generate New Tokens  │
│ • Access Token (15m) │
│ • Refresh Token (7d) │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ Database Operation   │
│ 1. Find user         │
│ 2. REMOVE old token  │ ← Prevents token reuse
│ 3. ADD new token     │
│ 4. Save              │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ Response             │
│ • New access token   │
│ • New refresh token  │
│   (in HttpOnly      │
│    cookie)          │
└──────────────────────┘
```

**Why Token Rotation:**
- Prevents replay attacks
- Limits stolen token usefulness
- One-time use per refresh token
- Industry best practice

---

## Code Structure

### Project Organization

```
src/
├── app.ts                      # Express app configuration
├── index.ts                    # Server entry point
├── config.ts                   # Environment configuration
│
├── controllers/                # Request handlers
│   ├── auth.controller.ts      # Auth endpoints
│   └── admin.controller.ts     # Admin endpoints
│
├── services/                   # Business logic
│   └── auth.service.ts         # Auth operations
│
├── models/                     # Database schemas
│   └── User.ts                 # User schema + hooks
│
├── routes/                     # API routes
│   ├── index.ts                # Route aggregator
│   ├── auth.routes.ts          # Auth routes
│   └── admin.routes.ts         # Admin routes
│
├── middlewares/                # Middleware functions
│   ├── auth.middleware.ts      # authenticate, authorize
│   ├── validation.middleware.ts # Zod validation
│   └── error.middleware.ts     # Error handling
│
├── utils/                      # Helper functions
│   ├── jwt.utils.ts            # Token generation/verification
│   └── response.utils.ts       # API response formatter
│
└── types/                      # TypeScript types
    └── auth.types.ts           # Auth interfaces
```

### Separation of Concerns

**Routes** → Define endpoints and middleware chain
```typescript
router.post('/login', validate(loginSchema), authController.login);
```

**Controllers** → Handle HTTP, delegate to services
```typescript
login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return ApiResponse.success(res, result);
});
```

**Services** → Business logic, database operations
```typescript
async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    // ... validation and token generation
    return { user, tokens };
}
```

**Models** → Schema, validation, hooks
```typescript
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});
```

---

## Key Implementation Decisions

### 1. Why HttpOnly Cookies for Refresh Tokens?
- **XSS Protection:** JavaScript cannot access
- **Automatic Handling:** Browser sends automatically
- **CSRF Protection:** Combined with SameSite
- **Industry Standard:** Recommended by OWASP

### 2. Why Short-Lived Access Tokens?
- **Limit Damage:** Stolen token expires quickly
- **No Need for Revocation:** Short expiry sufficient
- **Balance:** 15 minutes balances security and UX

### 3. Why Store Refresh Tokens in Database?
- **Revocation:** Can invalidate immediately
- **Multi-Device:** Track active sessions
- **Logout All:** Clear all tokens at once
- **Audit Trail:** Know which devices are active

### 4. Why Generic Error Messages?
- **Security:** Prevent user enumeration
- **Privacy:** Don't leak user information
- **Best Practice:** OWASP recommendation
- **Professional:** Industry standard

### 5. Why Centralized Error Handling?
- **Consistency:** All errors handled same way
- **Maintainability:** Single place to update
- **Security:** Control information disclosure
- **Developer Experience:** Less boilerplate

---

## Configuration

### Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET=your-secure-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-secure-refresh-secret-min-32-chars

# Token Expiration
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
```

### Security Checklist

**Development:**
- ✅ Cookie secure: false (HTTP allowed)
- ✅ Cookie sameSite: lax
- ✅ CORS enabled for localhost
- ✅ Basic password validation

**Production:**
- ✅ Cookie secure: true (HTTPS only)
- ✅ Cookie sameSite: strict
- ✅ CORS: specific origins only
- ✅ Strong password validation
- ✅ Rate limiting enabled
- ✅ Helmet security headers
- ✅ Environment variables from secure source
- ✅ Different JWT secrets
- ✅ MongoDB connection string secured
- ✅ Logging enabled
- ✅ Error messages generic

---

## Summary

### What Makes This Implementation Secure?

1. ✅ **Password Security:** Bcrypt hashing, 10 salt rounds
2. ✅ **Token Security:** JWT with separate secrets, expiry
3. ✅ **Cookie Security:** HttpOnly, Secure, SameSite
4. ✅ **RBAC:** Role-based access control
5. ✅ **Input Validation:** Zod schemas, strong requirements
6. ✅ **Error Handling:** Centralized, generic messages
7. ✅ **Token Management:** Rotation, revocation, database storage
8. ✅ **User Enumeration Prevention:** Generic error messages
9. ✅ **Self-Protection:** Can't demote/delete self
10. ✅ **Industry Standards:** OWASP recommendations

### Performance Considerations

- ✅ Password field excluded from queries by default (`select: false`)
- ✅ Refresh tokens excluded from queries (`select: false`)
- ✅ Database indexes on email (unique constraint)
- ✅ Efficient bcrypt rounds (10 - good balance)
- ✅ JWT verification is fast
- ✅ Minimal middleware chain

### Extensibility

Easy to add:
- More roles (moderator, superadmin, etc.)
- Email verification
- Password reset
- Two-factor authentication
- Rate limiting per user
- Account lockout after failed attempts
- Session management UI
- Activity logging

---

**🎉 Your implementation is production-ready and follows industry best practices!**
