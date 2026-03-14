const { Router } = require('express');
const authRoutes = require('./auth.routes');
const expenseRoutes = require('./expense.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/expenses', expenseRoutes);

module.exports = router;
