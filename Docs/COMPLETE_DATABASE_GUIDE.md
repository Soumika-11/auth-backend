# 🗄️ Complete Database Operations Guide

**MongoDB Operations, Management, and Verification**

---

## 📋 Table of Contents

1. [Database Overview](#database-overview)
2. [NPM Scripts](#npm-scripts)
3. [User Management](#user-management)
4. [Admin Management](#admin-management)
5. [MongoDB Atlas Interface](#mongodb-atlas-interface)
6. [Direct MongoDB Operations](#direct-mongodb-operations)
7. [Database Schema](#database-schema)
8. [Common Queries](#common-queries)
9. [Backup & Maintenance](#backup--maintenance)

---

## Database Overview

### Connection Information

**Type:** MongoDB Atlas (Cloud)  
**Cluster:** cluster0.qkmx1se.mongodb.net  
**Database Name:** test  
**Collections:** users  

**Connection String:**
```
mongodb+srv://username:password@cluster0.qkmx1se.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### Environment Configuration

```bash
# .env file
MONGO_URI=mongodb+srv://user:pass@cluster0.qkmx1se.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### Current Status

**Database:** test  
**Collection:** users  
**Documents:** User accounts with authentication data  

---

## NPM Scripts

### Database Verification Scripts

#### 1. Check Full Database Status

```bash
npm run db:check
```

**What it shows:**
- ✅ Database connection status
- ✅ Database name
- ✅ Total user count
- ✅ All user details (except password)
- ✅ Specific test user information
- ✅ Refresh token counts per user
- ✅ All collections in database

**Example Output:**
```
🔗 Connecting to MongoDB...
Connection String: mongodb+srv://****:****@cluster0...

✅ Connected to MongoDB successfully!

📊 Database Name: test

👥 Total Users in Database: 2

📋 All Users:
════════════════════════════════════════════════════════
1. User Details:
   ID: 68dfe6bcc21400e6ad6e10b7
   Email: test_user@example.com
   Role: admin
   Verified: false
   Created: Fri Oct 03 2025 20:37:40 GMT+0530
   Updated: Fri Oct 03 2025 23:15:35 GMT+0530
════════════════════════════════════════════════════════

🔍 Found Test User (test_user@example.com):
   ID: 68dfe6bcc21400e6ad6e10b7
   Email: test_user@example.com
   Role: admin
   Verified: false
   Active Refresh Tokens: 7
   Created At: Fri Oct 03 2025 20:37:40 GMT+0530

📦 Collections in Database:
   - users

🔌 Database connection closed
```

---

#### 2. Quick User List

```bash
npm run db:users
```

**What it shows:**
- ✅ Clean table format
- ✅ User ID, Email, Role
- ✅ Verification status
- ✅ Creation date
- ✅ Total count

**Example Output:**
```
📋 All Users:

┌─────────┬────────────────────────────┬─────────────────────────┬────────┬──────────┬─────────────────────────┐
│ (index) │ id                         │ email                   │ role   │ verified │ created                 │
├─────────┼────────────────────────────┼─────────────────────────┼────────┼──────────┼─────────────────────────┤
│ 0       │ '68dfe6bcc21400e6ad6e10b7' │ 'test_user@example.com' │ 'admin'│ false    │ '10/3/2025, 8:37:40 PM' │
│ 1       │ '68dfeca8bb3637c3c8899838' │ 'user@example.com'      │ 'user' │ false    │ '10/3/2025, 9:02:56 PM' │
└─────────┴────────────────────────────┴─────────────────────────┴────────┴──────────┴─────────────────────────┘

Total: 2 user(s)
```

---

#### 3. Query Specific User

```bash
npm run db:users <email>
```

**Example:**
```bash
npm run db:users test_user@example.com
```

**What it shows:**
- ✅ All user fields (including refresh tokens)
- ✅ Full JSON format
- ✅ Perfect for debugging

**Example Output:**
```
🔍 Searching for user: test_user@example.com

✅ User Found:
{
  "_id": "68dfe6bcc21400e6ad6e10b7",
  "email": "test_user@example.com",
  "role": "admin",
  "refreshTokens": [
    "eyJhbGciOiJIUzI1NiIs...",
    "eyJhbGciOiJIUzI1NiIs...",
    "eyJhbGciOiJIUzI1NiIs..."
  ],
  "isVerified": false,
  "createdAt": "2025-10-03T15:07:40.148Z",
  "updatedAt": "2025-10-03T17:45:59.319Z",
  "__v": 8
}
```

---

### Admin Management Scripts

#### 1. List All Users with Roles

```bash
npm run admin:list
```

**What it shows:**
- ✅ All admin users (with 👑 indicator)
- ✅ All regular users
- ✅ Summary statistics by role
- ✅ User details (ID, email, verified status, creation date)

**Example Output:**
```
🔗 Connecting to MongoDB...

📋 Total Users: 2

👑 Admins (1):
════════════════════════════════════════════════════════
1. test_user@example.com
   ID: 68dfe6bcc21400e6ad6e10b7
   Verified: ✗
   Created: 10/3/2025, 8:37:40 PM

👤 Regular Users (1):
════════════════════════════════════════════════════════
1. user@example.com
   ID: 68dfeca8bb3637c3c8899838
   Verified: ✗
   Created: 10/3/2025, 9:02:56 PM

📊 Summary:
┌─────────┬─────────┬───────┬────────────┐
│ (index) │ Role    │ Count │ Percentage │
├─────────┼─────────┼───────┼────────────┤
│ 0       │ 'Admin' │ 1     │ '50.0%'    │
│ 1       │ 'User'  │ 1     │ '50.0%'    │
│ 2       │ 'Total' │ 2     │ '100%'     │
└─────────┴─────────┴───────┴────────────┘

🔌 Database connection closed
```

---

#### 2. Promote User to Admin

```bash
npm run admin:set <email>
```

**Example:**
```bash
npm run admin:set user@example.com
```

**What it does:**
- ✅ Finds user by email
- ✅ Updates role to 'admin'
- ✅ Shows before/after status
- ✅ Provides next steps

**Example Output:**
```
🔗 Connecting to MongoDB...

✅ Connected to MongoDB successfully!

✅ Successfully updated user to admin!

👤 User Details:
   ID: 68dfeca8bb3637c3c8899838
   Email: user@example.com
   Role: admin 👑
   Verified: false
   Created: Fri Oct 03 2025 21:02:56 GMT+0530
   Updated: Fri Oct 03 2025 23:30:15 GMT+0530

🎉 User is now an administrator!

💡 Next steps:
   1. Login with this user to get an access token
   2. Use the token to access admin endpoints
   3. Test admin routes: GET /api/admin/users

🔌 Database connection closed
```

---

#### 3. Create New Admin User

```bash
npm run admin:create <email> <password>
```

**Example:**
```bash
npm run admin:create admin@example.com Admin@1234
```

**What it does:**
- ✅ Creates new user with admin role
- ✅ Auto-verifies the admin user
- ✅ Hashes password
- ✅ Provides login instructions

**Example Output:**
```
🔗 Connecting to MongoDB...

✅ Connected to MongoDB successfully!

✅ Admin user created successfully!

👤 Admin Details:
   ID: 68e01234ab5678c9d0123456
   Email: admin@example.com
   Role: admin 👑
   Verified: true
   Created: Fri Oct 03 2025 23:45:10 GMT+0530

🎉 Admin user is ready to use!

💡 Next steps:
   1. Login with these credentials:
      Email: admin@example.com
      Password: Admin@1234

   2. Example login command:
      curl -X POST http://localhost:4000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@example.com", "password": "Admin@1234"}'

   3. Use the access token to access admin endpoints

🔌 Database connection closed
```

---

## User Management

### User Document Structure

```javascript
{
  "_id": ObjectId("68dfe6bcc21400e6ad6e10b7"),
  "email": "user@example.com",
  "password": "$2a$10$hashedpasswordhere...",  // Bcrypt hash
  "role": "user",                              // or "admin"
  "refreshTokens": [                           // Active sessions
    "eyJhbGciOiJIUzI1NiIs...",
    "eyJhbGciOiJIUzI1NiIs..."
  ],
  "isVerified": false,
  "createdAt": ISODate("2025-10-03T15:07:40.148Z"),
  "updatedAt": ISODate("2025-10-03T15:07:40.148Z"),
  "__v": 0
}
```

### Field Descriptions

| Field | Type | Description | Default | Notes |
|-------|------|-------------|---------|-------|
| `_id` | ObjectId | Unique identifier | Auto-generated | MongoDB primary key |
| `email` | String | User email | - | Unique, lowercase, trimmed |
| `password` | String | Hashed password | - | Bcrypt, 10 salt rounds, `select: false` |
| `role` | String | User role | `'user'` | Enum: `['user', 'admin']` |
| `refreshTokens` | Array | Active JWT tokens | `[]` | For multi-device support, `select: false` |
| `isVerified` | Boolean | Email verification | `false` | Future feature |
| `createdAt` | Date | Creation timestamp | Auto | Mongoose timestamps |
| `updatedAt` | Date | Update timestamp | Auto | Mongoose timestamps |
| `__v` | Number | Version key | Auto | Mongoose versioning |

---

### Common User Operations

#### Count Total Users

```typescript
const totalUsers = await User.countDocuments();
```

#### Count by Role

```typescript
const adminCount = await User.countDocuments({ role: 'admin' });
const userCount = await User.countDocuments({ role: 'user' });
```

#### Find All Users (Excluding Sensitive Fields)

```typescript
const users = await User.find()
  .select('-password -refreshTokens')
  .lean();
```

#### Find User by Email

```typescript
const user = await User.findOne({ email: 'user@example.com' });
```

#### Find User with Password (for Login)

```typescript
const user = await User.findOne({ email: 'user@example.com' })
  .select('+password');  // Override select: false
```

#### Find User by ID

```typescript
const user = await User.findById('68dfe6bcc21400e6ad6e10b7');
```

#### Update User Role

```typescript
const user = await User.findById(userId);
user.role = 'admin';
await user.save();
```

#### Delete User

```typescript
await User.findByIdAndDelete(userId);
```

---

## Admin Management

### Admin Operations Workflow

```
1. CREATE ADMIN
   ├─→ npm run admin:create <email> <password>
   └─→ OR npm run admin:set <existing_email>

2. VERIFY ADMIN
   └─→ npm run admin:list

3. LOGIN AS ADMIN
   └─→ curl -X POST .../api/auth/login

4. USE ADMIN ENDPOINTS
   └─→ curl -X GET .../api/admin/users -H "Authorization: Bearer TOKEN"
```

### Admin Security Features

**Self-Protection:**
- ❌ Cannot demote yourself to user
- ❌ Cannot delete yourself
- ✅ Prevents accidental lockout

**Role Management:**
- ✅ Only admins can change roles
- ✅ Role changes are immediate
- ✅ New login required for role changes to take effect

---

## MongoDB Atlas Interface

### Accessing MongoDB Atlas

1. **Go to:** https://cloud.mongodb.com/
2. **Login** with your credentials
3. **Select** your cluster: Cluster0
4. **Click** "Browse Collections"
5. **Navigate** to: test → users

### Available Operations in Atlas

**View Documents:**
- See all users
- Search by field
- Filter by criteria
- Sort by any field

**Edit Documents:**
- Directly edit fields
- Add new fields
- Remove fields
- Validate changes

**Common Operations:**

```javascript
// Update user role
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Delete user
db.users.deleteOne({ email: "user@example.com" })

// Find admin users
db.users.find({ role: "admin" })

// Count users
db.users.countDocuments()
```

---

## Direct MongoDB Operations

### Using MongoDB Shell (mongosh)

**Connect to Database:**
```bash
mongosh "mongodb+srv://cluster0.qkmx1se.mongodb.net/" \
  --username dassoumika11_db_user
```

**Switch to Database:**
```javascript
use test
```

### Common mongosh Commands

#### View All Users
```javascript
db.users.find().pretty()
```

#### View Users Without Sensitive Data
```javascript
db.users.find(
  {},
  { password: 0, refreshTokens: 0 }
).pretty()
```

#### Count Documents
```javascript
// Total users
db.users.countDocuments()

// Admins only
db.users.countDocuments({ role: "admin" })

// Verified users
db.users.countDocuments({ isVerified: true })
```

#### Find Specific User
```javascript
// By email
db.users.findOne({ email: "test_user@example.com" })

// By ID
db.users.findOne({ _id: ObjectId("68dfe6bcc21400e6ad6e10b7") })

// By role
db.users.find({ role: "admin" })
```

#### Update Operations
```javascript
// Update user role
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Mark user as verified
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isVerified: true } }
)

// Remove all refresh tokens
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { refreshTokens: [] } }
)
```

#### Delete Operations
```javascript
// Delete specific user
db.users.deleteOne({ email: "user@example.com" })

// Delete unverified users (BE CAREFUL!)
db.users.deleteMany({ isVerified: false })
```

#### Aggregation Queries
```javascript
// Count users by role
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])

// Recent users (last 10)
db.users.find()
  .sort({ createdAt: -1 })
  .limit(10)

// Users with most sessions
db.users.find()
  .project({ email: 1, sessionCount: { $size: "$refreshTokens" } })
  .sort({ sessionCount: -1 })
```

---

## Database Schema

### User Schema Definition

```typescript
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    password: string;
    role: 'user' | 'admin';
    refreshTokens: string[];
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
            select: false, // Excluded from queries by default
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        refreshTokens: {
            type: [String],
            default: [],
            select: false, // Excluded from queries by default
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
```

### Schema Features

**Validation:**
- ✅ Email format validation
- ✅ Unique email constraint
- ✅ Password minimum length
- ✅ Role enum constraint
- ✅ Required field validation

**Security:**
- ✅ Automatic password hashing (pre-save hook)
- ✅ Password field excluded by default
- ✅ Refresh tokens excluded by default
- ✅ Lowercase email normalization
- ✅ Trimmed whitespace

**Timestamps:**
- ✅ Automatic createdAt
- ✅ Automatic updatedAt
- ✅ Managed by Mongoose

**Indexes:**
- ✅ Unique index on email
- ✅ Fast email lookups
- ✅ Prevents duplicate registrations

---

## Common Queries

### User Statistics

#### Get User Count by Role
```typescript
const stats = await User.aggregate([
    {
        $group: {
            _id: '$role',
            count: { $sum: 1 }
        }
    }
]);
```

#### Get Recent Users
```typescript
const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('email role isVerified createdAt');
```

#### Get Users with Most Active Sessions
```typescript
const activeUsers = await User.aggregate([
    {
        $project: {
            email: 1,
            role: 1,
            sessionCount: { $size: '$refreshTokens' }
        }
    },
    { $sort: { sessionCount: -1 } },
    { $limit: 10 }
]);
```

#### Get Verified vs Unverified Count
```typescript
const verifiedCount = await User.countDocuments({ isVerified: true });
const unverifiedCount = await User.countDocuments({ isVerified: false });
```

---

### Session Management

#### Count Active Sessions Per User
```typescript
const user = await User.findById(userId).select('+refreshTokens');
const sessionCount = user?.refreshTokens?.length || 0;
```

#### Find Users with Active Sessions
```typescript
const usersWithSessions = await User.find({
    refreshTokens: { $exists: true, $ne: [] }
}).select('email');
```

#### Clear All Sessions for User
```typescript
await User.updateOne(
    { _id: userId },
    { $set: { refreshTokens: [] } }
);
```

---

### Admin Management Queries

#### List All Admins
```typescript
const admins = await User.find({ role: 'admin' })
    .select('email isVerified createdAt');
```

#### Promote User to Admin
```typescript
await User.updateOne(
    { email: 'user@example.com' },
    { $set: { role: 'admin' } }
);
```

#### Demote Admin to User
```typescript
await User.updateOne(
    { email: 'admin@example.com' },
    { $set: { role: 'user' } }
);
```

#### Count Admins vs Users
```typescript
const adminCount = await User.countDocuments({ role: 'admin' });
const userCount = await User.countDocuments({ role: 'user' });
const percentage = (adminCount / (adminCount + userCount)) * 100;
```

---

## Backup & Maintenance

### Database Backup

#### Using MongoDB Atlas
1. Go to MongoDB Atlas Dashboard
2. Select your cluster
3. Click "⋮" menu → "Backup"
4. Configure backup schedule
5. Download on-demand backups

#### Using mongodump (CLI)
```bash
mongodump --uri="mongodb+srv://user:pass@cluster0.mongodb.net/test" \
  --out=./backup/$(date +%Y%m%d)
```

#### Using mongorestore (CLI)
```bash
mongorestore --uri="mongodb+srv://user:pass@cluster0.mongodb.net/test" \
  ./backup/20251003
```

---

### Maintenance Operations

#### Remove Expired Refresh Tokens
```typescript
// This would require JWT verification for each token
// Best done as a scheduled job
import jwt from 'jsonwebtoken';

const users = await User.find().select('+refreshTokens');

for (const user of users) {
    const validTokens = user.refreshTokens.filter(token => {
        try {
            jwt.verify(token, config.JWT_REFRESH_SECRET);
            return true;
        } catch {
            return false; // Token expired
        }
    });
    
    user.refreshTokens = validTokens;
    await user.save();
}
```

#### Delete Unverified Old Accounts
```typescript
// Delete users who haven't verified email in 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

await User.deleteMany({
    isVerified: false,
    createdAt: { $lt: thirtyDaysAgo }
});
```

#### Database Statistics
```typescript
// Get collection statistics
const stats = await mongoose.connection.db
    .collection('users')
    .stats();

console.log('Total size:', stats.size);
console.log('Document count:', stats.count);
console.log('Average document size:', stats.avgObjSize);
console.log('Indexes:', stats.nindexes);
```

---

## Monitoring & Logging

### Database Connection Monitoring

```typescript
// In src/index.ts
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});
```

### Query Performance Monitoring

```typescript
// Enable mongoose debugging
mongoose.set('debug', true);

// Custom query logging
User.find().explain('executionStats');
```

---

## Troubleshooting

### Common Issues

#### Connection Timeout
```
Error: connect ETIMEDOUT
```
**Solution:** Check firewall rules, IP whitelist in MongoDB Atlas

#### Authentication Failed
```
Error: Authentication failed
```
**Solution:** Verify username/password, check connection string

#### Duplicate Key Error
```
MongoServerError: E11000 duplicate key error
```
**Solution:** Email already exists (expected behavior)

#### Document Not Found
```
User not found
```
**Solution:** Check ObjectId format, verify document exists

---

## Quick Reference

### NPM Scripts Summary

```bash
# Database verification
npm run db:check              # Full database status
npm run db:users              # List all users (table)
npm run db:users <email>      # Query specific user

# Admin management
npm run admin:list            # List users by role
npm run admin:set <email>     # Promote to admin
npm run admin:create <email> <password>  # Create admin
```

### Common MongoDB Commands

```javascript
// Find
db.users.find({ role: "admin" })
db.users.findOne({ email: "user@example.com" })

// Count
db.users.countDocuments()
db.users.countDocuments({ role: "admin" })

// Update
db.users.updateOne({ email: "user@example.com" }, { $set: { role: "admin" } })

// Delete
db.users.deleteOne({ email: "user@example.com" })

// Aggregation
db.users.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
```

---

## Best Practices

### Security

1. ✅ Never log passwords or tokens
2. ✅ Use `select: false` for sensitive fields
3. ✅ Validate user input before database operations
4. ✅ Use indexes for frequently queried fields
5. ✅ Regular backups of production database
6. ✅ Rotate database credentials periodically
7. ✅ Monitor unusual query patterns
8. ✅ Limit database user permissions

### Performance

1. ✅ Use `.lean()` for read-only queries
2. ✅ Select only needed fields
3. ✅ Use indexes effectively
4. ✅ Paginate large result sets
5. ✅ Avoid N+1 queries
6. ✅ Cache frequently accessed data
7. ✅ Use aggregation for complex queries
8. ✅ Monitor slow queries

### Maintenance

1. ✅ Regular database backups
2. ✅ Clean up expired tokens periodically
3. ✅ Delete old unverified accounts
4. ✅ Monitor database size
5. ✅ Review and optimize indexes
6. ✅ Update connection string in .env only
7. ✅ Test database operations in development first
8. ✅ Document schema changes

---

**🎉 Your database is well-structured and production-ready!**
