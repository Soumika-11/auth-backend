import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import config from '../src/config';

async function setAdminRole() {
    try {
        const email = process.argv[2];

        if (!email) {
            console.log('Error: Email is required');
            console.log('Usage: npm run admin:set <email>');
            console.log('Example: npm run admin:set test_user@example.com');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...\n');
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB successfully!\n');

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log(`User not found: ${email}`);
            console.log('\nAvailable users:');
            const allUsers = await User.find().select('email role');
            allUsers.forEach(u => {
                console.log(`   - ${u.email} (${u.role})`);
            });
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`User ${email} is already an admin`);
            console.log('\nUser Details:');
            console.log(`   ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Verified: ${user.isVerified}`);
            console.log(`   Created: ${user.createdAt}`);
            process.exit(0);
        }

        user.role = 'admin';
        await user.save();

        console.log('Successfully updated user to admin!\n');
        console.log('User Details:');
        console.log(`   ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Verified: ${user.isVerified}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Updated: ${user.updatedAt}`);

        console.log('\nUser is now an administrator!');
        console.log('\nNext steps:');
        console.log('   1. Login with this user to get an access token');
        console.log('   2. Use the token to access admin endpoints');
        console.log('   3. Test admin routes: GET /api/admin/users');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

setAdminRole();
