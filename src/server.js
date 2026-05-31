

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
// import { nanoid } from "nanoid";
import { PostgresConnection } from "./DatabaseConnection/postgresConnections.js";
import { redisConnection } from "./DatabaseConnection/redisConnection.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

// PostgresConnection();
// redisConnection();


app.use('/',(req,res) => {
    res.send(`<html><body><h1>URL SHORTENER SERVICE IS RUNNING !!! </h1></body></html>`);
})


app.listen(3000,() => {
    console.log(`Server is running on port : ${process.env.PORT}`);
})