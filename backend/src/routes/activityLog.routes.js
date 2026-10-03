const express = require('express');
const router  = express.Router();
const ActivityLogController = require('../controllers/activityLog.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.use(authorize('superuser')); // only superuser can view/manage logs

router.get('/purge',  ActivityLogController.purge);      // DELETE old logs by age
router.get('/',       ActivityLogController.getAll);
router.get('/:id',    ActivityLogController.getById);
router.delete('/purge', ActivityLogController.purge);
router.delete('/:id', ActivityLogController.deleteById);

module.exports = router;
