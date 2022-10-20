const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  projectName: {
    type: String,
  },
  sapId: {
    type: String,
  },
  from: {
    type: Date,
  },
  to: {
    type: Date,
  },
  transportAllowance: {
    type: Number,
  },
  reports: {
    type: [mongoose.Object],
    ref: 'Report'
  }
});

module.exports = Project = mongoose.model('Project', ProjectSchema)