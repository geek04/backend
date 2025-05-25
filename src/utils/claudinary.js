import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';



    // Configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
// Upload function  
const uploadOnClaudinary= async(localFilePath) => {
    try {
        if(!localFilePath) return null
        // Upload the file to Cloudinary
        const response=await Claudinary.uploader.upload(LocalFilePath,{
            resource_type: 'auto'   
        })
        // file has been uploaded
        console.log('file has been uloaded',response.url);
        return response
    } catch (error) {
        fs.unlink(localFilePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            } else {
                console.log('File deleted successfully');
            }
        });
        return null; // Delete the locally saved file if upload fails

        
    }
}

export {uploadOnClaudinary}