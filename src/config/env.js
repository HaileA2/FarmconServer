import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 5000,
    mongoUrl: process.env.MONGODB_URL,
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
};