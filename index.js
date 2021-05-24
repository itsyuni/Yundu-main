const express = require("express");
const app = express();
const http = require("http").createServer(app);
const subdomain = require('express-subdomain');
const appRoot = require('app-root-path');
const bodyParser = require('body-parser')
const fs = require("fs");
const cors = require('cors')
const InitiateMongoServer = require("./config/db");
InitiateMongoServer();
const PORT = process.env.PORT || 5000;
app.use('/archi/',express.static(appRoot + '/archi/'))
app.use(bodyParser.json({limit: '50mb'}));
  
app.use(bodyParser.urlencoded({ extended: true ,limit:'50mb'}));
app.use(express.json({limit:'50mb'}));
app.use(function(req, res, next) {
    
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});
app.post('/wall',(req,res)=>{
let data = req.body.base64.replace(/^data:image\/png;base64,/, "");
data += data.replace('+', ' ');
let binaryData = new Buffer.from(data, 'base64').toString('binary');
    let date = Date.now();
    fs.writeFileSync(`check/images/check${date}.png`, binaryData, {encoding:"binary"});
    const python = require("child_process").spawn('python3', ['check/check.py','check/images/check'+date+'.png']);
   
    python.stdout.on('data', (result) => {

        fs.unlinkSync(`check/images/check${date}.png`);
        console.log(result.toString("utf-8"))
        res.end(result.toString("utf-8"))
    });
})
app.use(cors())

app.options('*', cors());
const appRouter = express.Router();
appRouter.use('/',express.static(appRoot + '/subdomains/app/'));
appRouter.get('/*',(req,res)=>{
    res.sendFile(appRoot+'/subdomains/app/index.html')
})

const subdomainApiContent = require('./subdomains/api');

const subdomainAssetsContent = require('./subdomains/assets');
app.use(subdomain('app',appRouter))
app.use(subdomain('api',subdomainApiContent))

app.use(subdomain('assets',subdomainAssetsContent))
app.get('/',(req,res)=>{
    res.sendFile(appRoot + '/views/home.html')
})
app.get('/about',(req,res)=>{
res.sendFile(appRoot + '/views/about.html');
})
app.get('/signout',(req,res)=>{
    res.sendFile(appRoot+'/views/signout.html')
})
app.get('/register',(req,res)=>{
    res.sendFile(appRoot + '/views/reg.html')
})

app.get('/login',(req,res)=>{
    res.sendFile(appRoot + '/views/login.html')
})
app.get('/verify',(req,res)=>{
    res.sendFile(appRoot+'/views/verifyemail.html')
})
app.get('/env',(req,res)=>{
    res.send(process.env.NODE_ENV)
})
app.get('/archi', function(req, res){
    res.sendFile(appRoot + '/archi/index.html');
  });
app.use((req, res,next)=>{
    res.sendFile(appRoot+'/views/404.html');
 });
  app.set('port', PORT);
http.listen(PORT);
