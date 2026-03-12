const prisma = require('../config/prisma');
const {
  createExpenseSchema,
  updateExpenseSchema,
  filterSchema,
} = require('../validators/expense.validators');

const getDateRange = (filter) => {
  const now = new Date();
  switch (filter) {
    case 'past_week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { gte: start, lte: now };
    }
    case 'past_month': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return { gte: start, lte: now };
    }
    case 'last_3_months': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return { gte: start, lte: now };
    }
    default:
      return null;
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const query = filterSchema.parse(req.query);
    const { filter, startDate, endDate } = query;

    let dateFilter = {};
    if (filter === 'custom') {
      dateFilter = { date: { gte: startDate, lte: endDate } };
    } else if (filter) {
      dateFilter = { date: getDateRange(filter) };
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.userId, ...dateFilter },
      orderBy: { date: 'desc' },
    });

    res.json({ count: expenses.length, expenses });
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const data = createExpenseSchema.parse(req.body);

    const expense = await prisma.expense.create({
      data: {
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: data.date,
        description: data.description,
        userId: req.user.userId,
      },
    });

    res.status(201).json({ message: 'Expense created successfully.', expense });
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const data = updateExpenseSchema.parse(req.body);

    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ message: 'Expense updated successfully.', expense });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    await prisma.expense.delete({ where: { id: req.params.id } });

    res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExpenses, createExpense, getExpenseById, updateExpense, deleteExpense };
