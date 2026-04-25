const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  empId:     { type: String, required: true },
  type:      { type: String, enum: ['annual','sick','casual'], required: true },
  from:      { type: Date, required: true },
  to:        { type: Date, required: true },
  days:      { type: Number, required: true },
  reason:    { type: String },
  status:    { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  appliedOn: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Leave', LeaveSchema);