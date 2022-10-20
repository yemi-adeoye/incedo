const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  username: {
    type: mongoose.ObjectId,
    ref: 'User'
  },
  leaveHours: {
    type: Number,
  },
  workHours: {
    type: Number,
  },
  afternoonDays: {
    type: Number,
    def: (this.workHours - this.leaveHours ) / 8
  },
  nightDays: {
    type: Number,
  },
  eligibleForTA: {
    type: Number,
    def: (this.nightDays + this.afternoonDays)
  },
  transportAllowance: {
    type: Number,
  },
  totalAllowance: {
    type: Number,
  },
});

module.exports = Report = mongoose.model('Report', ReportSchema)