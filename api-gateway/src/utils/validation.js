const Joi = require("joi");

const validateRefreshToken = (data) => {
  const schema = Joi.object({
    refreshToken: Joi.string()
      .min(80) // Ensure token length is correct
      .messages({
        "string.length": "Invalid refresh token length, must be 160 characters",
        "any.required": "Refresh token is required",
      }),
  }).unknown(true);

  // Perform validation and log errors properly
  const { error } = schema.validate(data);
  if (error) {
    console.error("Validation Error:", error.details); // Log the error for debugging
    return { success: false, message: error.details[0].message };
  }

  return { success: true }; // Successful validation
};

module.exports = { validateRefreshToken };
