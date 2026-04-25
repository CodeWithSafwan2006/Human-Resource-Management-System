const router  = require('express').Router();
const ctrl    = require('../controllers/employeeController');
const protect = require('../middleware/auth');

router.get('/',       protect(['hr','finance']), ctrl.getAllEmployees);
router.post('/',      protect(['hr']),           ctrl.addEmployee);
router.put('/:id',    protect(['hr']),           ctrl.updateEmployee);
router.delete('/:id', protect(['hr']),           ctrl.deleteEmployee);

module.exports = router;