const express = require("express");
const router = express.Router();
const appRoot = require('app-root-path');
router.use('/',express.static(appRoot + '/subdomains/assets/'));
router.get('/',(req,res)=>{
    res.redirect('https://yundu.co',301);
})
router.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
});
module.exports = router;
