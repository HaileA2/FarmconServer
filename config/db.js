//database is going to be configured here
import mongoose from 'mongoose';

export const connectdb =async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database connected successfully");
    }catch(error){
        console.log("Database connection failed",error);
    }
}