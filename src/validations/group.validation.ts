import Joi from 'joi';

export const createGroupSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'Group name must be at least {#limit} characters',
      'string.max': 'Group name cannot exceed {#limit} characters',
      'any.required': 'Group name is required'
    }),

  description: Joi.string()
    .max(500)
    .optional(),

  amount: Joi.number()
    .positive()
    .greater(0)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),

  cycleDuration: Joi.number()
    .integer()
    .min(1)
    .max(31)
    .required()
    .messages({
      'number.base': 'Cycle duration must be a number',
      'number.integer': 'Cycle duration must be an integer',
      'number.min': 'Cycle duration must be at least 1 day',
      'number.max': 'Cycle duration cannot exceed 31 days',
      'any.required': 'Cycle duration is required'
    }),

  startDate: Joi.date()
    .min('now')
    .optional()
});

export const joinGroupSchema = Joi.object({
  invitationCode: Joi.string()
    .length(8)
    .optional()
});

export const updateGroupSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .optional(),

  description: Joi.string()
    .max(500)
    .optional(),

  isActive: Joi.boolean()
    .optional()
});

export const groupIdParamSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Group ID must be a valid hexadecimal',
      'string.length': 'Group ID must be 24 characters long',
      'any.required': 'Group ID is required'
    })
});