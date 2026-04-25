    const Employee   = require('../models/Employee');
    const Leave      = require('../models/Leave');
    const Attendance = require('../models/Attendance');

    exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ role: 'employee' }).select('-password');
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
    };

    exports.addEmployee = async (req, res) => {
    try {
        const count = await Employee.countDocuments();
        const empId = `E${String(count + 1).padStart(3, '0')}`;
        const emp = new Employee({ ...req.body, empId });
        await emp.save();
        res.status(201).json({ message: 'Employee added', empId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
    };

    exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Employee.findOneAndUpdate(
        { empId: id }, req.body, { new: true }
        ).select('-password');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
    };

    exports.deleteEmployee = async (req, res) => {
    try {
        await Employee.findOneAndDelete({ empId: req.params.id });
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
    };