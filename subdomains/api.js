const express = require("express");
const router = express.Router();
const appRoot = require("app-root-path")
const User = require("../model/User");
const jwt = require("jsonwebtoken");

const auth = require("../middleware/auth");
router.use('/cravatars',express.static(appRoot + '/subdomains/api/cravatars/'))
router.use('/schavatars',express.static(appRoot + '/subdomains/api/schavatars/'))
router.use('/avatars',express.static(appRoot + '/subdomains/api/avatars/'))
router.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
});
router.post('/email',(req,res)=>{
    let email = req.body.email;
    User.findOne({
      email
      },function(err,result){
          if(Boolean(result)){
          res.json({msg:'exists'})
          }
          else{
            res.json({msg:'not exists'})
          }
      });
})
router.post('/username',(req,res)=>{
    let username = req.body.username;
    User.findOne({
      username
      },function(err,result){
        if(Boolean(result)){  
        res.json({msg:'exists'})
        }
        else{
            res.json({msg:'good'})
        }
    });
})
router.post('/avatar',(req,res)=>{
    let base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");

    let binaryData = new Buffer.from(base64Data, 'base64').toString('binary');
let date = Date.now();

fs.writeFileSync(`api/avatars/${date}.png`, binaryData, {encoding:"binary"});
    res.end(date+'.png');
    
})
router.get('/user',(req,res)=>{
    const username = req.query.username;
    User.findOne({username:{ '$regex' : username, '$options' : 'i' }},'-_id -__v -password',function(err,doc){
    
  if(err) return res.json({status:'error'});
  if(doc){
      res.json({status:'ok',data:doc});
  }
  else{
    res.json({status:'not found'})
  }
    
    })
  
  })
  router.get('/env',(req,res)=>{
      res.send(process.env.NODE_ENV);
  })
  router.get("/me", auth, async (req, res) => {
      try {
        const user = await User.findById(req.user.id);
        
    user.set('_id', undefined);
    user.set('password', undefined)
    user.set('__v', undefined)
        res.json({status:'ok',data:user});
      } catch (e) {
        res.send({ status: "error" });
      }
    });
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const api_key = 'key-7909edaa1b43042ea4c2d5275ecdcbb5'
const domain = 'mailgun.yundu.co';
const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
const mailcomposer = require('mailcomposer');


let userId;

const SecretCode = require("../model/Code");
function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
router.post(
  "/signup",
  [
    check("username", "Please Enter a Valid Username").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({
        error: errors.array(),
      });
    }
    let { username, email, password, name, surname, avatar } = req.body;
    try {
username = username.toLowerCase()
      let user = await User.findOne({
        email,
      });
      let user2 = await User.findOne({
        username,
      });
      if (user) {
        return res.status(400).json({
          msg: "email already exists",
        });
      }
      if (user2) {
        return res.status(400).json({
          msg: "username already exists",
        });
      }

      user = new User({
        username,
        email,
        avatar,
        surname,
        name,
        password,
      });
      let userpassword = await bcrypt.hash(password, 10);
      user.password = userpassword;
      await user.save();
      userId = user.id;
      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 200,
        },
        async (err, token) => {
          if (err) throw err;
          let secretCodeNow = new SecretCode({
            email: user.email,
            code: makeid(10),
          });
          await secretCodeNow.save(function(err,obj){
            if(err) throw err;
            console.log(obj)
          });

          let mailOptions = mailcomposer({
  from: 'Yundu <verification@yundu.co>',
  to: user.email,
  subject: 'Подтверждение почты',
  html: `<html><body><a href="https://yundu.co/verify/?id=${userId}&code=${secretCodeNow.code}">Подтвердить</a></body></html>`
});

          await mailOptions.build(function(mailBuildError, message) {

    let dataToSend = {
        to: user.email,
        message: message.toString('ascii')
    };

    mailgun.messages().sendMime(dataToSend, function (sendError, body) {
   if(sendError){console.log(sendError)}
 });
});
          res.status(200).json({
            token,
          });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.json({
        msg: err.message,
      });
    }
  }
);

router.post(
  "/login",
  [
    check("email", "invalid email").isEmail(),
    check("password", "invalid password").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      
      return res.json({
        error: errors.array(),
      });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email,
      });

      if (!user){
      
        return res.json({
          msg: "user not exists",
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(isMatch);
      if (!isMatch) {
        return res.json({
          msg: "incorrect password",
        });
      }
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 200,
        },
        (err, token) => {
          if (err) throw err;
          res.json({
            token
          });
        }
      );
    } catch (e) {
      res.json({
        msg: "error"
      });
    }
  }
);

router.post("/verify", async (req, res) => {
  try{
  const { userId, secretCode } = req.body;
  if(!userId || !secretCode){
   await res.json({status:'no params'})
  }
  const user = await User.findById(userId);
  if (user) {

   const email = user.email;
    await SecretCode.findOne({ email: email }, async function (err, obj) {
if(obj){
if (obj.code === secretCode) {
  if(user.status === 'verified'){

    await res.json({status:'verified'});
  }
  else{
      user.status = "verified";
      await user.save();
      await res.json({status:'ok'});
  }
    } else {
      await res.json({status:'not match'});
    }
}
else{
await res.json({status:'error'});
}
    });
    
  } else {
    await res.json({status:'error'});
  }
}
catch(err){
  console.log(err)
}
});

const Classroom = require("../model/Classroom");

const School = require("../model/School");
router.post("/search",(req,res)=>{
  let {city,school,classroom} = req.body;
  if(!city){
res.json({status:'invalid query'});
  }
  else if(city && !school || city && school === 'schools' && !classroom){
School.find({city:city},'-_id -__v',(err,schools)=>{
  if(schools.length){
    if(schools.length > 1){

  let schoolsMap = [];
  schools.forEach(function(school) {
    schoolsMap.push(school);
  });
  res.json({status:'ok',data:schoolsMap});
    }
    else{
    
  res.json({status:'ok',data:schools});
    }
  }
  else{
    res.json({status:'not found'})
  }
})
  }
  else if(city && school && school !== 'schools' && !classroom){
    School.find({city:city,number:school},'-_id -__v',(err,schools)=>{
      if(schools.length){
        if(schools.length > 1){

      let schoolsMap = [];
      schools.forEach(function(school) {
        
        schoolsMap.push(school);
      });
      res.json({status:'ok',data:schoolsMap});
        }
        else{
      res.json({status:'ok',data:schools});
        }
      }
      else{
        res.json({status:'not found'})
      }
    })
  }
  else if(city && school && classroom && classroom === 'classrooms'){
    School.findOne({city:city,number:school},(err,school)=>{
      Classroom.find({school:school._id},'-_id -__v',(err,classrooms)=>{
        if(classrooms.length){
if(classrooms.length > 1){

      let classroomsMap = [];
      classrooms.forEach(function(classroom) {
        classroomsMap.push(classroom);
      });
      res.json({status:'ok',data:classroomMap});
}
else{
  
res.json({status:'ok',data:classrooms});
}
        }
        else{
res.json({status:'not found'});
        }
    })
    })
    
  }
  else if(city && school && school !== 'schools' && classroom && classroom !== 'classrooms'){
    School.findOne({city:city,number:school},'-_id -__v', (err,school)=>{
      Classroom.find({school:school._id,number:classroom},(err,classrooms)=>{
        if(classrooms.length){
if(classrooms.length > 1){

      let classroomsMap = [];
      classrooms.forEach(function(classroom) {
        classroomsMap.push(classroom);
      });
      res.json({status:'ok',data:classroomMap});
}
else{
  
res.json({status:'ok',data:classrooms});
}
        }
        else{
res.json({status:'not found'});
        }
    })
    })
  }
})
router.post("/createschool",(req,res)=>{
  let {number,description,verified,city} = req.body;
  console.log(req.body)
let school = new School({
  number,
  description,
  verified,
  city
})
if(school.save()){
res.json({status:'ok'})

}})
    module.exports = router;
