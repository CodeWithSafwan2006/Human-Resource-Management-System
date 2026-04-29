const Punch = require('../models/Punch');

exports.punchIn = async (req, res) => {
  try {
    const { empId, date, time } = req.body;
    let punch = await Punch.findOne({ empId, date });
    if (punch) {
      return res.status(400).json({ message: 'Already punched in today' });
    }
    punch = new Punch({ empId, date, punchIn: time });
    await punch.save();
    res.status(201).json(punch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.punchOut = async (req, res) => {
  try {
    const { empId, date, time } = req.body;
    let punch = await Punch.findOne({ empId, date });
    if (!punch) {
      return res.status(404).json({ message: 'No punch-in record found for today' });
    }
    punch.punchOut = time;
    await punch.save();
    res.status(200).json(punch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPunchesByEmployee = async (req, res) => {
  try {
    const punches = await Punch.find({ empId: req.params.empId }).sort({ date: -1 });
    res.status(200).json(punches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPunches = async (req, res) => {
  try {
    const punches = await Punch.find().sort({ date: -1 });
    res.status(200).json(punches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
