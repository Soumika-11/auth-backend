import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import config from '../src/config';

async function checkDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        console.log(`Connection String: ${config.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@')}\n`);

        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB successfully!\n');

        const dbName = mongoose.connection.db?.databaseName || 'unknown';
        console.log(`Database Name: ${dbName}\n`);

        const totalUsers = await User.countDocuments();
        console.log(`Total Users in Database: ${totalUsers}\n`);

        if (totalUsers > 0) {
            console.log('All Users:');
            console.log('═'.repeat(80));

            const users = await User.find()
                .select('email role isVerified createdAt updatedAt')
                .lean();

            users.forEach((user, index) => {
                console.log(`\n${index + 1}. User Details:`);
                console.log(`   ID: ${user._id}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Verified: ${user.isVerified}`);
                console.log(`   Created: ${user.createdAt}`);
                console.log(`   Updated: ${user.updatedAt}`);
            });

            console.log('\n' + '═'.repeat(80));

            const testUser = await User.findOne({ email: 'test_user@example.com' })
                .select('email role isVerified refreshTokens createdAt');

            if (testUser) {
                console.log('\nFound Test User (test_user@example.com):');
                console.log(`   ID: ${testUser._id}`);
                console.log(`   Email: ${testUser.email}`);
                console.log(`   Role: ${testUser.role}`);
                console.log(`   Verified: ${testUser.isVerified}`);
                console.log(`   Active Refresh Tokens: ${(testUser as any).refreshTokens?.length || 0}`);
                console.log(`   Created At: ${testUser.createdAt}`);
            } else {
                console.log('\nTest user (test_user@example.com) not found');
            }

        } else {
            console.log('No users found in the database');
        }

        console.log('\nCollections in Database:');
        const collections = await mongoose.connection.db?.listCollections().toArray() || [];
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

checkDatabase();
