import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();

router.route("/register").post(
    upload.fields([  // for files uploading injected a middleware upload
        {
            name: "coverImage",  // this name should be same in frontend and backend as well 
            maxCount:1,
        },
        {
            name : "soilHealthCard" ,
            maxCount:1,
        }
    ]),
    registerUser
    )


export default router