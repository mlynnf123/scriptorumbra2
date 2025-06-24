import Joi from "joi";

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).max(128).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "string.max": "Password cannot exceed 128 characters",
      "any.required": "Password is required",
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),

  chatMessage: Joi.object({
    content: Joi.string().min(1).max(10000).required().messages({
      "string.min": "Message cannot be empty",
      "string.max": "Message cannot exceed 10,000 characters",
      "any.required": "Message content is required",
    }),
    sessionId: Joi.string().uuid().optional(),
  }),

  updateSession: Joi.object({
    title: Joi.string().min(1).max(500).required().messages({
      "string.min": "Title cannot be empty",
      "string.max": "Title cannot exceed 500 characters",
      "any.required": "Title is required",
    }),
  }),
};

export const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: "Validation schema not found",
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    req.validatedData = value;
    next();
  };
};
