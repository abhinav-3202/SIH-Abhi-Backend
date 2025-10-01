import multer from "multer"

const storage = multer.diskStorage({
    destination : function (req,file,cb){      // req - json from me data  // file - all the files present aa jaati h 
        cb(null , "./public/temp")
    },
    filename : function (req,file,cb){
        cb(null , file.originalname) // from here we get the localfilepath which is /public/temp
    }
})

export const upload = multer({
    storage,
})