const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
  empId:            { type: String, required: true, unique: true },
  basic:            { type: Number, default: 0 },
  hra:              { type: Number, default: 0 },
  bonus:            { type: Number, default: 0 },
  transport:        { type: Number, default: 0 },
  medical:          { type: Number, default: 0 },
  pf:               { type: Number, default: 0 },
  tax:              { type: Number, default: 0 },
  other_deductions: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Salary', SalarySchema);