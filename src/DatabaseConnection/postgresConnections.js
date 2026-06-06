import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "url_shortner",
    user: "postgres",
    password: "Be$t@1ps!",
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

export async function PostgresConnection() {
    try {
        await pool.connect();
        console.log("Postgres connected successfully !");
        return pool;
        
    }
    catch(error){
        console.log("Error in postgres connection  : ",error);
        throw error;
    }
}