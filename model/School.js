const mongoose = require("mongoose");

const SchoolSchema = mongoose.Schema({
  number: {
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
classrooms: [{type:mongoose.ObjectId,required:true}],
  city:{
      type:String,
      required:true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});
module.exports = mongoose.model("school", SchoolSchema);
