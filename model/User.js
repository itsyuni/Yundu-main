const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  socialStatus:{
    type:String,
    required:false
  },
  city:{
    type:String,
    required:false
  },
  avatar: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  status:{
    type: String,
    default: "pending"
  }
});
module.exports = mongoose.model("user", UserSchema);
