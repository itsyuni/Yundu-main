const mongoose = require("mongoose");

const ClassroomSchema = mongoose.Schema({
  number: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    required: true
  },
  members: [{ type : String,required:true}],
  schoolId:{
    type:String,
    required:true
  },
  admin:{
      type: mongoose.ObjectId,
      required:true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});
module.exports = mongoose.model("classroom", ClassroomSchema);
