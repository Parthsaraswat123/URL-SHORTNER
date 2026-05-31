
import fs from 'fs';

const UrlController = {};
export default UrlController;

UrlController.createSingleUrl = async(req,res) => {
    try{
        let urlDetails = req.body;

        if(!urlDetails.original_url){
            return ResponseHandler.error(res,"Please provide original URL",400);
        }
        if(!urlDetails.expiry_time){
            expiry_date = Date.now() + 48 * 60 * 60 * 1000;
        }

        const short_url = nanoid.generate(8);

        let checkUrl = await Pool.query('SELECT original_url FROM urls WHERE original_url = $1',[urlDetails.original_url]);
        if(checkUrl.rows.length > 0){
            return ResponseHandler.error(res,"Original URL already exists",400);
        }

        await Pool.query('INSERT INTO urls (original_url,short_url,expiry_date,user_id) VALUES ($1,$2,$3,$4)',[urlDetails.original_url,short_url,expiry_date,req.user.id]);
        return ResponseHandler.success(res,"URL created successfully!",{});
    }
    catch(error){
        console.log("Error in URL Create API : ",error);
        return ResponseHandler.error(res,"Error in URL Create API",500);
    }
}

UrlController.bulkCreateUrl = async(req,res) => {
    try{
        const filePath = `${__dirname}/uploads/${req.file.filename}`;
        // let urlDetails = req.body;
        let file = req.file;
        const uploadJob = await Pool.query('INSERT INTO import_jobs (file_name,status) VALUES ($1,$2)',[file.originalname,'processing']);
        
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
        let pageLimit = limit || 10
        let offset = (pageNo - 1) * limit;

        
        let userData = await Pool.query('SELECT * FROM urls WHERE user_id = $1 offset $2 limit $3 ORDER BY created_at desc',[userId,offset,pageLimit]);

        let data = {
                page_number:pageNo,
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
        if(existUrl){
            if(existUrl.rows.length > 0){
                let urlData = existUrl.row[0];
                if(urlData.expiry_time != null && urlData.expiry_time < Date.now()){
                    return res.sendFile(path.join(__dirname,'/public/pageNotFound.html'));
                }
                else{
                    const originalUrl = urlData.original_url;
                    res.redirect(originalUrl);
                }   
                
            }   
            else{
                return res.sendFile(path.join(__dirname,'/public/pageNotFound.html'));
            }
        }
        else{
            return res.sendFile(path.join(__dirname,'/public/pageNotFound.html'));
        }

    }catch(error){
        console.log("Error in redirect API : ",error);
        return ResponseHandler.error(res,"Error in redirect API",500);
    }
}

export default UrlController;