const multer =require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination : (req,file,cb)=>{
        cb(null,'public/uploads')
    },
    filename:(req,file,cb)=>{
        const ext = path.extname(file.originalname)
        cb(null,file.fieldname + '-' + Date.now() + ext)
    },

})  

const fileFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith('image/')){
        cb(null,true)
    }
    else{
        cb(new Error ('Not an image.Please select a image file to upload'),false)
    }
}

const upload =multer({storage,fileFilter})

module.exports = upload