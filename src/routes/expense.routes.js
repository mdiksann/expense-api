const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const {
  getExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');

const router = Router();

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
