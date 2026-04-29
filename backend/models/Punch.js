const mongoose = require('mongoose');

const PunchSchema = new mongoose.Schema({
  empId:    { type: String, required: true },
  date:     { type: String, required: true }, // Format: YYYY-MM-DD
  punchIn:  { type: String },                 // Format: HH:MM AM/PM
  punchOut: { type: String },                 // Format: HH:MM AM/PM
}, { timestamps: true });

// Ensure one punch record per employee per day
PunchSchema.index({ empId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Punch', PunchSchema);
