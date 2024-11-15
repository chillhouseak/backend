

import dotenv from 'dotenv'
import connectDB from "./db/index.js";
 connectDB()
 dotenv.config({
    path: './env'
 })

 .then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`surver is running at port:${process.env.port}`);
    })
 })
 .catch((err) =>{
    console.log("mongo db connection fail",err);
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