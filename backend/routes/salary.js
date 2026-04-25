const router  = require('express').Router();
const ctrl    = require('../controllers/salaryController');
const protect = require('../middleware/auth');

router.get('/my',               protect(['employee']),           ctrl.getSalary);
router.get('/all',              protect(['finance','hr']),       ctrl.getAllSalaries);
router.get('/:empId',           protect(['finance','hr']),       ctrl.getSalary);
router.put('/:empId',           protect(['finance']),            ctrl.setSalary);
router.get('/:empId/attendance',protect(['finance','hr','employee']), ctrl.getAttendance);

module.exports = router;