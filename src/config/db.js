//database is going to be configured here
import mongoose from 'mongoose';
import env from './env.js';
export const connectdb =async()=>{
    try{
        await mongoose.connect(env.mongoUrl);
        console.log("Database connected successfully");
    }catch(error){
        console.log("Database connection failed",error);
    }
}