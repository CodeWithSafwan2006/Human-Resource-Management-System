const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
  empId:       { type: String, unique: true },
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['employee','hr','finance'], default: 'employee' },
  department:  { type: String },
  designation: { type: String },
  phone:       { type: String },
  joinDate:    { type: Date },
}, { timestamps: true });

EmployeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);