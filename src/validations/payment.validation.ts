import Joi from 'joi';
import { TransactionType } from '../models/transaction.model';

export const paymentSchema = Joi.object({
  groupId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Group ID must be a valid hexadecimal',
      'string.length': 'Group ID must be 24 characters long',
      'any.required': 'Group ID is required'
    }),

  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),

  type: Joi.string()
    .valid(...Object.values(TransactionType))
    .required(),

  reference: Joi.string()
    .optional(),

  description: Joi.string()
    .max(200)
    .optional()
});

export const payoutSchema = Joi.object({
  groupId: Joi.string()
    .hex()
    .length(24)
    .required(),

  bankDetails: Joi.object({
    accountNumber: Joi.string()
      .length(10)
      .required(),

    bankCode: Joi.string()
      .required()
  }).when('type', {
    is: TransactionType.PAYOUT,
    then: Joi.required()
  })
});

export const paymentIdParamSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
});

export const paymentQuerySchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'completed', 'failed')
    .optional(),

  type: Joi.string()
    .valid(...Object.values(TransactionType))
    .optional(),

  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
});