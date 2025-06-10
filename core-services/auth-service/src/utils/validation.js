const Joi = require("joi");

const validateRegistration = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(16).required(),
    state: Joi.string().min(3).max(100).required(),
    city: Joi.string().min(3).max(100).required(),
    pincode: Joi.number().integer().min(100000).max(999999).required(),
    phone: Joi.string()
      .min(10)
      .max(10)
      .regex(/^[0-9]{10}$/)
      .messages({
        "string.pattern.base": "Invalid phone number - 10 digits required",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
      })
      .required(),
  }).unknown(true);

  return schema.validate(data);
};

const validateRegistrationOTP = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    state: Joi.string().min(3).max(100).required(),
    city: Joi.string().min(3).max(100).required(),
    pincode: Joi.number().integer().min(100000).max(999999).required(),
    code: Joi.string().min(6).max(6).messages({
      "string.pattern.base": "Invalid OTP - 6 digits required",
      "string.empty": "OTP is required",
      "any.required": "OTP is required",
    }),
    phone: Joi.string()
      .min(10)
      .max(10)
      .regex(/^[0-9]{10}$/)
      .messages({
        "string.pattern.base": "Invalid phone number - 10 digits required",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
      })
      .required(),
  }).unknown(true);

  return schema.validate(data);
};

const validatePhone = (data) => {
  const schema = Joi.object({
    phone: Joi.string()
      .min(10)
      .max(10)
      .regex(/^[0-9]{10}$/)
      .messages({
        "string.pattern.base": "Invalid phone number - 10 digits required",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
      })
      .required(),
  }).unknown(true);
  return schema.validate(data);
};

const validatePhoneOtp = (data) => {
  const schema = Joi.object({
    phone: Joi.string()
      .min(10)
      .max(10)
      .regex(/^[0-9]{10}$/)
      .messages({
        "string.pattern.base": "Invalid phone number - 10 digits required",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
      })
      .required(),
    code: Joi.string().min(6).max(6).messages({
      "string.pattern.base": "Invalid OTP - 6 digits required",
      "string.empty": "OTP is required",
      "any.required": "OTP is required",
    }),
  }).unknown(true);
  return schema.validate(data);
};

const validateOtp = (data) => {
  const schema = Joi.object({
    otp: Joi.string().min(6).max(6).messages({
      "string.pattern.base": "Invalid OTP - 6 digits required",
      "string.empty": "OTP is required",
      "any.required": "OTP is required",
    }),
  }).unknown(true);
  return schema.validate(data);
};

const validateRegisterWithOtp = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    state: Joi.string().min(3).max(100).required(),
    city: Joi.string().min(3).max(100).required(),
    pincode: Joi.number().integer().min(100000).max(999999).required(),
    phone: Joi.string()
      .min(10)
      .max(10)
      .regex(/^[0-9]{10}$/)
      .messages({
        "string.pattern.base": "Invalid phone number - 10 digits required",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
      })
      .required(),
  }).unknown(true);

  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }).unknown(true);
  return schema.validate(data);
};

const validateRefreshToken = (data) => {
  const schema = Joi.object({
    refreshToken: Joi.string()
      .min(80) // Adjust length to match the 80 character token
      .required()
      .messages({
        "string.length": "Invalid refresh token length, must be 160 characters",
        "any.required": "Refresh token is required",
      }),
  }).unknown(true);

  // Perform validation and log errors properly
  const { error } = schema.validate(data);
  if (error) {
    console.error("Validation Error:", error.details); // Proper logging
    return { success: false, message: error.details[0].message };
  }

  return { success: true }; // Successful validation
};

const validateRtAt = (data) => {
  const schema = Joi.object({
    refreshToken: Joi.string().min(80).required().messages({
      "string.length": "Invalid refresh token length, must be 160 characters",
      "any.required": "Refresh token is required",
    }),
    accessToken: Joi.string().min(80).required().messages({
      "string.length": "Invalid access token length, must be 160 characters",
      "any.required": "Access token is required",
    }),
  }).unknown(true);
  return schema.validate(data);
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateRtAt,
  validateRegistrationOTP,
  validatePhone,
  validatePhoneOtp,
  validateRegisterWithOtp,
  validateOtp,
};
