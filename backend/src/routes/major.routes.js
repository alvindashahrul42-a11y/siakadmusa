const express = require('express');
const router = express.Router();
const MajorController = require('../controllers/major.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET all without pagination (dropdown)
router.get('/all', authorize('superuser', 'teacher'), MajorController.getAllNoPagination);

// CRUD
router.post('/',   authorize('superuser'), MajorController.create);
router.get('/',    authorize('superuser', 'teacher'), MajorController.getAll);
router.get('/:id', authorize('superuser', 'teacher'), MajorController.getById);
router.put('/:id', authorize('superuser'), MajorController.update);
router.delete('/:id', authorize('superuser'), MajorController.delete);

module.exports = router;
