require('dotenv').config()
const jwt = require('jsonwebtoken')
const nodemailer= require('nodemailer')

OTP_SECRET =process.env.OTP_SECRET
OTP_EXPIRATION="1m"

// Configure email transport

const transporter= nodemailer.createTransport({
    service:"Gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    },
})

// Generating otp

const generateOtp =()=>Math.floor(100000 + Math.random()*900000).toString()

// Send otp Email

const sendOtpEmail = async(email,otp)=>{
    await transporter.sendMail({
        from:process.env.EMAIL_USER,
        to:email,
        subject:"BoomX Otp verification",
        text:`Your otp is ${otp}.It is expired in 1 minute`,
    })
}

//Generate Jwt token for storing otp

const generateOtpToken = (userData,otp)=>{
   
    
    return jwt.sign({...userData,otp},OTP_SECRET,{expiresIn:OTP_EXPIRATION})
  
    
}



//verify otp token 

const verifyOtpToken =(token,userOtp)=>{
try{
    
    
    const decoded = jwt.verify(token,OTP_SECRET)
    console.log("decoded token data ",decoded);
    console.log("decoded otp",decoded.otp,typeof decoded.otp);
    return decoded.otp === userOtp ? decoded : null
    

  
    
}
catch(error){
    return null
}
   

}


module.exports ={
    generateOtp,
    sendOtpEmail,
    generateOtpToken,
    verifyOtpToken
}