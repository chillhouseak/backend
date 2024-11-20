import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadcloudinary = async(localfilepath)=>{
        try {
            if(!localfilepath) return null;
            const responce = await cloudinary.uploader.upload(localfilepath,{
                resource_type: 'auto'
            })
            console.log("file has been uploaded on cloudinary", responce.url);
            return responce;
        } catch (error) {
            fs.unlinkSync(localfilepath)
            return null
        }
    }

    export {uploadcloudinary}
    
    