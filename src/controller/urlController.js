import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { pool } from '../DatabaseConnection/postgresConnections.js';
import ResponseHandler from '../helpers/responseHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UrlController = {};

UrlController.createSingleUrl = async(req,res) => {
    try{
        let urlDetails = req.body;

        if(!urlDetails.original_url){
            return ResponseHandler.error(res,"Please provide original URL",400);
        }
        
        let expiry_date = urlDetails.expiry_date || urlDetails.expiry_time;
        if(!expiry_date){
            expiry_date = new Date(Date.now() + 48 * 60 * 60 * 1000);
        } else {
            expiry_date = new Date(expiry_date);
        }

        const short_url = nanoid(8);

        let checkUrl = await pool.query('SELECT original_url FROM urls WHERE original_url = $1 AND user_id = $2',[urlDetails.original_url, req.user.id]);
        if(checkUrl.rows.length > 0){
            return ResponseHandler.error(res,"Original URL already exists for this user",400);
        }

        await pool.query('INSERT INTO urls (original_url,short_url,expiry_date,user_id) VALUES ($1,$2,$3,$4)',[urlDetails.original_url,short_url,expiry_date,req.user.id]);
        return ResponseHandler.success(res,"URL created successfully!", { short_url });
    }
    catch(error){
        console.log("Error in URL Create API : ",error);
        return ResponseHandler.error(res,"Error in URL Create API",500);
    }
}

UrlController.bulkCreateUrl = async(req,res) => {
    try{
        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        let file = req.file;
        const uploadJob = await pool.query('INSERT INTO import_jobs (file_name,status,user_id) VALUES ($1,$2,$3) RETURNING id',[file.originalname,'PENDING',req.user.id]);
        
        return ResponseHandler.success(res,"URL Processing started successfully!",200);

    }
    catch(error){
        console.log("Error in URL Create API : ",error);
        return ResponseHandler.error(res,"Error in URL Create API",500);
    }
}

UrlController.getUrlData = async(req,res) => {
    try {
        let userId = req.user.id;
        let {pageNo,limit} = req.query;
        let pageLimit = parseInt(limit) || 10;
        let page = parseInt(pageNo) || 1;
        let offset = (page - 1) * pageLimit;

        let userData = await pool.query('SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at desc offset $2 limit $3',[userId,offset,pageLimit]);

        let data = {
            page_number:page,
            limit:pageLimit,
            data:userData.rows
        }
        if(userData.rows.length == 0){
            return ResponseHandler.error(res,"No data found for this user",{data:[]},400);
        }
        else{
            return ResponseHandler.success(res,"Data fetched successfully",data);
        }
    }catch(error){
        console.log("Error in get Url Data : ",error);
        return ResponseHandler.error(res,"Internal Server Error : ",500);
    }
}

UrlController.redirectUrl = async(req,res) => {
    try {
        const shortUrl = req.params.short_url;
        let existUrl = await pool.query('SELECT * FROM urls WHERE short_url = $1',[shortUrl]);
        if(existUrl && existUrl.rows.length > 0){
            let urlData = existUrl.rows[0];
            if(urlData.expiry_date != null && new Date(urlData.expiry_date) < new Date()){
                return res.sendFile(path.join(__dirname,'../public/pageNotFound.html'));
            }
            else{
                const originalUrl = urlData.original_url;
                return res.redirect(originalUrl);
            }   
        }
        else{
            return res.sendFile(path.join(__dirname,'../public/pageNotFound.html'));
        }

    }catch(error){
        console.log("Error in redirect API : ",error);
        return ResponseHandler.error(res,"Error in redirect API",500);
    }
}

export default UrlController;
