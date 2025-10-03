import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import app from './app';
import config from './config';

const start = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB Atlas');
        app.listen(config.PORT, () => {
            console.log(`Server listening on http://localhost:${config.PORT}`);
        });
    } catch (err) {
        console.error('Failed to start', err);
        process.exit(1);
    }
};

start();
