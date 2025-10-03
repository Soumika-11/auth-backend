import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import config from '../src/config';

async function listUsers() {
    try {
        console.log('Connecting to MongoDB...\n');
        await mongoose.connect(config.MONGO_URI);
        
        const users = await User.find()
            .select('email role isVerified createdAt')
            .sort({ role: -1, createdAt: -1 })
            .lean();

        if (users.length === 0) {
            console.log('No users found in the database\n');
            process.exit(0);
        }

        console.log(`Total Users: ${users.length}\n`);

        const admins = users.filter(u => u.role === 'admin');
        const regularUsers = users.filter(u => u.role === 'user');

        if (admins.length > 0) {
            console.log(`Admins (${admins.length}):`);
            console.log('═'.repeat(80));
            admins.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email}`);
                console.log(`   ID: ${user._id}`);
                console.log(`   Verified: ${user.isVerified ? '✓' : '✗'}`);
                console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
                console.log('');
            });
        } else {
            console.log('Admins: None\n');
            console.log('To create an admin user, run:');
            console.log('   npm run admin:create <email> <password>');
            console.log('   or promote an existing user:');
            console.log('   npm run admin:set <email>\n');
        }

        if (regularUsers.length > 0) {
            console.log(`Regular Users (${regularUsers.length}):`);
            console.log('═'.repeat(80));
            regularUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email}`);
                console.log(`   ID: ${user._id}`);
                console.log(`   Verified: ${user.isVerified ? '✓' : '✗'}`);
                console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
                console.log('');
            });
        }

        console.log('\nSummary:');
        console.table([
            { Role: 'Admin', Count: admins.length, Percentage: `${((admins.length / users.length) * 100).toFixed(1)}%` },
            { Role: 'User', Count: regularUsers.length, Percentage: `${((regularUsers.length / users.length) * 100).toFixed(1)}%` },
            { Role: 'Total', Count: users.length, Percentage: '100%' }
        ]);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

listUsers();
