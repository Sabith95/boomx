const mongoose = require('mongoose')
const connectDb = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDb Connected Successfully");
        
    }
    catch(error){
        console.error("MongoDb Connection error",error);
        
    };
    
}

module.exports= connectDb