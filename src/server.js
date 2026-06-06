

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

// import { nanoid } from "nanoid";
import { PostgresConnection } from "./DatabaseConnection/postgresConnections.js";
import { redisConnection } from "./DatabaseConnection/redisConnection.js";
import userRoute from "./routes/userRoute.js";
import urlRoute from "./routes/urlRoute.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));


PostgresConnection();
redisConnection();





app.use('/api/users', userRoute);
app.use('/api/urls', urlRoute);

app.get('/',(req,res) => {
    res.send(`<html><body><h1>URL SHORTENER SERVICE IS RUNNING !!! </h1></body></html>`);
})


const PORT = process.env.PORT || 3000;
app.listen(PORT,() => {
    console.log(`Server is running on port : ${PORT}`);
})