import Joi from 'joi';
import { UserRole } from '../types/types';

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least {#limit} characters long',
      'string.max': 'Username cannot exceed {#limit} characters',
      'any.required': 'Username is required'
    }),

  email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})')).required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
      'any.required': 'Password is required'
    }),

  passwordConfirm: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password'
    }),

  role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.MEMBER)
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'))
    .required(),
  passwordConfirm: Joi.string().valid(Joi.ref('password')).required()
});