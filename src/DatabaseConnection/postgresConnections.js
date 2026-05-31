import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export async function PostgresConnection() {
    try {
        const pgConnection = new Pool({
            host: "localhost",
            port: 5432,
            database: "url_shortener",
            user: "admin",
            // password: "password",
            max: 50,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        });

        await pgConnection.connect();
        console.log("Postgres connected successfully !");
        return pgConnection;
        
    }
    catch(error){
        console.log("Error in postgres connection  : ",error);
        throw error;
    }
}