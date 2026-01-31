import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { connectdb } from './config/db';

const app=express();

app.use(express.json());


//database connection
connectdb();
//start the server
const PORT = process.env.PORT || 5000;
    app.listen(PORT,()=>{
        console.log(`Server running on port ${PORT}`);
    })