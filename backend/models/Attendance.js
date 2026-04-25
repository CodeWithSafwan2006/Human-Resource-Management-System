const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  empId:       { type: String, required: true },
  monthKey:    { type: String, required: true },
  workingDays: { type: Number, default: 26 },
  present:     { type: Number, default: 0 },
  absent:      { type: Number, default: 0 },
  late:        { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);