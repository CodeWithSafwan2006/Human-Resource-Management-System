const router  = require('express').Router();
const ctrl    = require('../controllers/aiController');
const protect = require('../middleware/auth');

router.post('/chat', protect(['employee','hr','finance']), ctrl.chat);

module.exports = router;