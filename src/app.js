//main express setup goes here
import express from "express";
import morgan from "morgan";
import cors from "cors";
import routes from "./Routes.js"

const app=express();

//middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

//routes
app.use('/api/v1',routes);

export default app;