

import dotenv from 'dotenv'
import connectDB from "./db/index.js";
 connectDB()
 dotenv.config({
    path: './env'
 })


/*import express from "express";
const app =express();
(async()=>{
    try{
        await mongoose.connect(`${process.env.
            MONGODB_URI}/${DB_NAME}`)
        
    } catch(error){
        console.error("ERROR:",error)
        throw err
    }
}) () */