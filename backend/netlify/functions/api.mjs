import mongoose from 'mongoose';
import serverless from 'serverless-http';
import app from '../../server.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voxio';

const serverlessApp = serverless(app);

// Reuse MongoDB connection across warm invocations
export const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
    }

    return serverlessApp(event, context);
};
