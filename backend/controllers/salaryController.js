const Salary     = require('../models/Salary');
const Attendance = require('../models/Attendance');

exports.getSalary = async (req, res) => {
  try {
    const empId = req.params.empId || req.user.empId;
    const salary = await Salary.findOne({ empId });
    if (!salary) return res.status(404).json({ message: 'Salary not configured' });
    res.json(salary);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.setSalary = async (req, res) => {
  try {
    const salary = await Salary.findOneAndUpdate(
      { empId: req.params.empId }, req.body, { new: true, upsert: true }
    );
    res.json({ message: 'Salary updated', salary });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find();
    res.json(salaries);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAttendance = async (req, res) => {
  try {
    const empId = req.params.empId || req.user.empId;
    const attendance = await Attendance.find({ empId });
    res.json(attendance);
  } catch (err) { res.status(500).json({ message: err.message }); }
};