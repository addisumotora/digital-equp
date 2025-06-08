import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/apiError';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(new ApiError(400, `Validation error: ${errorMessages.join(', ')}`));
    }

    // Replace req.body with the validated value
    req.body = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(new ApiError(400, `Parameter validation error: ${errorMessages.join(', ')}`));
    }

    req.params = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(new ApiError(400, `Query validation error: ${errorMessages.join(', ')}`));
    }

    req.query = value;
    next();
  };
};