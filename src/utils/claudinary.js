import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); 
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';



    // Configuration
cloudinary.config({ 
        cloud_name: process.env.CLAUDINARY_CLOUD_NAME, 
        api_key: process.env.CLAUDINARY_API_KEY, 
        api_secret: process.env.CLAUDINARY_API_SECRET
    });
// Upload function  
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // console.log("File has been uploaded:", response.url);

        fs.unlink(localFilePath, (err) => {
            if (err) console.error("Error deleting file:", err);
            else console.log("File deleted successfully");
        });

        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error); // <-- Add this

        fs.unlink(localFilePath, (err) => {
            if (err) console.error("Error deleting file:", err);
            else console.log("File deleted successfully");
        });

        return null;
    }
};


export {uploadOnCloudinary}