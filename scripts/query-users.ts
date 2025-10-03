import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import config from '../src/config';

async function queryUsers() {
    try {
        await mongoose.connect(config.MONGO_URI);
        
        const email = process.argv[2];

        if (email) {
            console.log(`Searching for user: ${email}\n`);
            const user = await User.findOne({ email })
                .select('+refreshTokens')
                .lean();

            if (user) {
                console.log('User Found:');
                console.log(JSON.stringify(user, null, 2));
            } else {
                console.log('User not found');
            }
        } else {
            console.log('All Users:\n');
            const users = await User.find()
                .select('email role isVerified createdAt')
                .sort({ createdAt: -1 })
                .lean();

            if (users.length > 0) {
                console.table(users.map(u => ({
                    id: u._id.toString(),
                    email: u.email,
                    role: u.role,
                    verified: u.isVerified,
                    created: new Date(u.createdAt).toLocaleString()
                })));
                console.log(`\nTotal: ${users.length} user(s)`);
            } else {
                console.log('No users found');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

queryUsers();
