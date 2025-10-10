import { ApiError } from "../utils/ApiError.js";
import { asyncHnadler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


// this middleware is for verifying user is there or not 
// req has access to cookies from app.js file by app.use(cookieParser())
// ? optional for the case of mobile phone

export const verifyJWT = asyncHnadler(async(req, _ ,next)=>{
    try {

        // console.log("Cookies received:", req.cookies);
    // console.log("Authorization header:", req.headers.authorization);

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") // custom headers sent by user 
    
        if (!token) {
            throw new ApiError(401,"Unauthorized request")
        }
        
        // console.log("Token received:", token);

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken") // while returning the accesstoken we have returned _id
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token ")
        }
    
        req.user = user 
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }

})

