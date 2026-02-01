import app from "./app.js";
import dotenv from 'dotenv';
dotenv.config();
import { connectdb } from './config/db.js';
//database connection
connectdb();
//start the server
const PORT = process.env.PORT || 5000;
    app.listen(PORT,()=>{
        console.log(`Server running on port ${PORT}`);
    })