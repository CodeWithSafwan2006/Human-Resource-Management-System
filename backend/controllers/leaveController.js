const Leave = require('../models/Leave');

exports.applyLeave = async (req, res) => {
  try {
    const leave = new Leave({ ...req.body, empId: req.user.empId });
    await leave.save();
    res.status(201).json({ message: 'Leave applied', leave });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ empId: req.user.empId }).sort({ appliedOn: -1 });
    res.json(leaves);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ appliedOn: -1 });
    res.json(leaves);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json({ message: `Leave ${req.body.status}`, leave });
  } catch (err) { res.status(500).json({ message: err.message }); }
};