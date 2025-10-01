import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit:"10mb",}))   // data from form or sth like that 
app.use(express.urlencoded({extended: true , limit:"18mb"}))   // Handles HTML form submissions or query string data
app.use(express.static("public"))
app.use(cookieParser())   // Parses cookies attached to incoming requests (can be accessed like req.cookies.token) if browser send a cookie 


// routes import 
// .use() in Express is how you plug in middlewares or mount routes into your app

import userRouter from "./routes/user.routes.js"


// routes declaration
app.use("/api/v1/users",userRouter)


export { app }