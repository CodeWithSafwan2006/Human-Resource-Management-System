const router  = require('express').Router();
const ctrl    = require('../controllers/employeeController');
const protect = require('../middleware/auth');

router.get('/',       ctrl.getAllEmployees);
router.post('/',      ctrl.addEmployee);
router.put('/:id',    ctrl.updateEmployee);
router.delete('/:id', ctrl.deleteEmployee);

module.exports = router;