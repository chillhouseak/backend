import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadcloudinary = async(localFilePath)=>{
        try {
            if(!localFilePath) return null;
            try {
                const response = await cloudinary.uploader.upload(localFilePath,{
                    resource_type: 'auto'
                })
                console.log("file has been uploaded on cloudinary", response.url);
                return response;
            }catch (error){
                console.log("error from cloud" , error)
            }
          } catch (error) {
            fs.unlinkSync(localFilePath)
            return null
        }
    }

    export {uploadcloudinary}
    
    