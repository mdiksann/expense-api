const { z } = require('zod');

const CATEGORIES = ['FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'HEALTH', 'UTILITIES', 'OTHER'];

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(', ')}` }),
  }),
  date: z.coerce.date({ invalid_type_error: 'Date must be a valid date string' }),
  description: z.string().max(500).optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

const filterSchema = z
  .object({
    filter: z.enum(['past_week', 'past_month', 'last_3_months', 'custom']).optional(),
    startDate: z.coerce
      .date({ invalid_type_error: 'startDate must be a valid date string' })
      .optional(),
    endDate: z.coerce
      .date({ invalid_type_error: 'endDate must be a valid date string' })
      .optional(),
  })
  .refine((data) => (data.filter === 'custom' ? !!data.startDate && !!data.endDate : true), {
    message: 'startDate and endDate are required when filter is "custom"',
  });

module.exports = { createExpenseSchema, updateExpenseSchema, filterSchema, CATEGORIES };
