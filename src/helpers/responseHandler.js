
const ResponseHandler = {};

ResponseHandler.success = (res,message, data = {}, statusCode = 200) => {
    try {
        res.status(statusCode).json({
        success: true,
        message,
        data,
        });
    }
    catch(error) { 
        console.log("Error in success handler : ",error);
        throw error;
    }
    
}

ResponseHandler.error = (res, error, statusCode = 500) => {
    try {
        res.status(statusCode).json({
            success: false,
            error,
            });
    }
    catch(error) {
        console.log("Error in error handler : ",error);
        throw error;
    }

}