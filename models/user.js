const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
  },
  userId: {
    type: String,
  },
  password: {
    type: String,
  },
  managerId: {
    type: mongoose.ObjectId,
    default: null,
    ref: 'User'
  },
  reports: {
    type: mongoose.ObjectId,
    default: null,
    ref: 'Report'
  },
  role: {
    type: String,
  },
  dateActive: {
    type: Date,
    default: null,
  },
  dateJoined: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Number,
  },
});

User = mongoose.model("User", UserSchema);

module.exports = User;
