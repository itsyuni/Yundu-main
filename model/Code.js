const mongoose = require("mongoose");
const secretCode = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now(),
        expires: 1200,
    },
});
module.exports = mongoose.model("secretCode",secretCode)