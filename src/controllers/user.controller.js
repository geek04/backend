import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';

import {User} from '../models/user.model.js';
import {claudinary} from '../utils/cloudinary.js';
import { uploadOnClaudinary } from '../utils/claudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
const registerUser=asyncHandler( async(req,res)=> {
    //get user details from request body
    //validation- not empty
    //check if user already exists
    //check for images,check for avatar
    //upload them to cloudinary, avatar
    //create user object- create entry in database
    //remove password and refresh token from response
    //check for user creation
    //return response
    const {fullname,email,username,passsword}= req.body
    console.log("email: ",email);
    if([fullname,email,userName,password].some((field) => field?.trim()===' ')
    ){
       throw new ApiError(400,"All fields are required")
  }

  const existedUser = User.findOne({
    $or : [{username},{email}]
  })

  if(existedUser){
    throw new ApiError(409,"User already exists with email or username")
  }

   const avatarLocalPath =req.files?.avator[0]?.path;
   const coverLocalPath =req.files?.coverImage[0]?.path;

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar image is required")
   }

   const avatar=await uploadOnClaudinary(avatarLocalPath)
   const cover=await uploadOnClaudinary(coverLocalPath)
   if(!avatar){
    throw new ApiError(500,"Avatar image upload failed")
   }
   const user= await User.create({
    fullname,
    avatar: avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.tolowerCase(),
   })
   const createdUser = await user.findbyId(user._id, {
    password: 0,
    refreshToken: 0
   })

   if(!createdUser){
    throw new ApiError(500,"User creation failed")
   }    
   return res.status(201).json(
    new ApiResponse( 
       
       200,createdUser,"User created successfully"
        
    )  
   )    

})  

export {registerUser}