import multer from "multer";
import fs from "fs";
import path from "path";


const uploadFiles = async (fileName, fileDetail,) => {
    try {
        const UPLOAD_DIR = path.join(__dirname, 'uploads');

        // Ensure the target upload directory exists using fs
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        // Configure how Multer handles storage options
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, UPLOAD_DIR);
            },
            filename: (req, file, cb) => {
                // Keeps original extension intact
                // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null,path.extname(file.originalname));
            }
        });

        const upload = multer({ storage: storage });

        return upload;

    }
    catch (error) {
        console.log("Error in multer : ", error);
        throw error;
    }
}

export default uploadFiles;
