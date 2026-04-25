const Employee = require('../models/Employee');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Employee.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Wrong password' });
    const token = jwt.sign(
      { id: user._id, empId: user.empId, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: {
        id: user.empId, name: user.name, role: user.role,
        email: user.email, department: user.department, designation: user.designation
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMe = async (req, res) => {
  try {
    const user = await Employee.findOne({ empId: req.user.empId }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};