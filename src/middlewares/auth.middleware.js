import {apiError} from "../utils/apierror.js"
import {asynchandler} from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js"

export const verifyJWT = asynchandler(async(req, res, next)=>{
    try {
        const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") || req.body
        if(!token){
            throw new apiError(401, "Unauthorized request")
        }
       try {
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     
        const user = await User.findById(decodedtoken?._id).select("-password -refreshtoken")
        if(!user){
         throw new apiError(401,"invalid access token")
        }
        req.user = user;
        next();
       } catch (error) {
            throw new apiError(401 , "error while validating token")
       }
    } catch (error) {
        throw new apiError(401,error?.message ||"invalid access token")
    }
})

