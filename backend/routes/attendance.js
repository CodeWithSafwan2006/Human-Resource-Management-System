const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/punch-in', attendanceController.punchIn);
router.post('/punch-out', attendanceController.punchOut);
router.get('/:empId',    attendanceController.getPunchesByEmployee);
router.get('/',          attendanceController.getAllPunches);

module.exports = router;
