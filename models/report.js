const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  reportName: {
    type: String,
  },
});

module.exports = Report = mongoose.model('Report', ReportSchema)