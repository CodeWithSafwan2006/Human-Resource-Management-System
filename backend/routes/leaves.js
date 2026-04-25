const router  = require('express').Router();
const ctrl    = require('../controllers/leaveController');
const protect = require('../middleware/auth');

router.post('/',          protect(['employee']), ctrl.applyLeave);
router.get('/my',         protect(['employee']), ctrl.getMyLeaves);
router.get('/all',        protect(['hr']),       ctrl.getAllLeaves);
router.put('/:id/status', protect(['hr']),       ctrl.updateLeaveStatus);

module.exports = router;