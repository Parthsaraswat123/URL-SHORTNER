import redis from "redis";
import dotenv from "dotenv";
dotenv.config();

export const redisConnection = async () => {
    try{
        const redisClient = redis.createClient({
            host: "localhost",
            port: 6379,
            // password: "[PASSWORD]"
        });

        redisClient.on("error",(error) => {
            console.log("Error in redis connection : ",error);
        });

        await redisClient.connect();
        console.log("Redis connected successfully !");
        return redisClient;
    }
    catch(error){
        console.log("Error in redis connection : ",error);
        throw error;
    }
}
