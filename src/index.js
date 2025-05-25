//require("dotenv").config({path: './env'});

import dotenv from "dotenv";
//import mongoose from "mongoose";
//import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";

import express from "express";
dotenv.config({path:"./env"});

import { app } from './app.js';
connectDB() 

.then(() =>{
    app.on("error", (err) =>{
        console.log("Error connecting to MongoDB :",err);
    });
    app.listen(process.env.PORT ||8000,() => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`)
    })
})
.catch((err) => {
    console.log("MongoDB connection failed ", err);
})

/*
import express from "express";
const app = express();

( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI} /${DB_NAME}`)
        app.on("error", (err) => {
            console.log("Error connecting to MongoDB:", err);
            throw err;
        });
        app.listen (process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.log("Error connecting to MongoDB:", error);
        throw error;
        
    }
})()
 */