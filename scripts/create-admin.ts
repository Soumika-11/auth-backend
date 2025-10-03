import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import config from '../src/config';

async function createAdminUser() {
    try {
        const email = process.argv[2];
        const password = process.argv[3];

        if (!email || !password) {
            console.log('Error: Email and password are required');
            console.log('Usage: npm run admin:create <email> <password>');
            console.log('Example: npm run admin:create admin@example.com Admin@123');
            console.log('\nPassword requirements:');
            console.log('   - At least 8 characters');
            console.log('   - At least one uppercase letter');
            console.log('   - At least one lowercase letter');
            console.log('   - At least one number');
            console.log('   - At least one special character (@$!%*?&)');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...\n');
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB successfully!\n');

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

        if (existingUser) {
            console.log(`User already exists: ${email}`);
            console.log(`   Current role: ${existingUser.role}`);
            
            if (existingUser.role === 'admin') {
                console.log('   This user is already an admin!');
            } else {
                console.log('\nTo promote this user to admin, run:');
                console.log(`   npm run admin:set ${email}`);
            }
            process.exit(1);
        }

        const adminUser = new User({
            email: email.toLowerCase().trim(),
            password: password,
            role: 'admin',
            isVerified: true,
        });

        await adminUser.save();

        console.log('Admin user created successfully!\n');
        console.log('Admin Details:');
        console.log(`   ID: ${adminUser._id}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Verified: ${adminUser.isVerified}`);
        console.log(`   Created: ${adminUser.createdAt}`);

        console.log('\nAdmin user is ready to use!');
        console.log('\nNext steps:');
        console.log('   1. Login with these credentials:');
        console.log(`      Email: ${adminUser.email}`);
        console.log(`      Password: ${password}`);
        console.log('\n   2. Example login command:');
        console.log(`      curl -X POST http://localhost:4000/api/auth/login \\`);
        console.log(`        -H "Content-Type: application/json" \\`);
        console.log(`        -d '{"email": "${adminUser.email}", "password": "${password}"}'`);
        console.log('\n   3. Use the access token to access admin endpoints');

    } catch (error: any) {
        if (error.name === 'ValidationError') {
            console.error('Validation Error:');
            Object.values(error.errors).forEach((err: any) => {
                console.error(`   - ${err.message}`);
            });
        } else {
            console.error('Error:', error.message || error);
        }
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

createAdminUser();
