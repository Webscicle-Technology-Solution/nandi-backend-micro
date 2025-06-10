const { logger } = require("../utils/logger");
const { validateRefreshToken } = require("../utils/validation");

const addRefreshTokenToRequestBody = (req, res, next) => {
  // Ensure req.cookies is defined (to avoid undefined errors)
  const cookies = req.cookies || {}; // Default to empty object if cookies are undefined
  const refreshToken = cookies.refreshToken; // Access refreshToken from cookies
  console.log(`Refresh Token: ${refreshToken} received to gateway`);

  // Perform validation on the cookies (check if refreshToken is valid)
  const error = validateRefreshToken(cookies);
  console.log(`RefreshToken JOI Error : ${JSON.stringify(error) || error}`);

  if (error && !error.success) {
    logger.warn(
      "[Refresh Token] Validation Error, resetting it to null",
      error.message // Log the error message instead of details[0].message
    );

    // Clear the refresh token from cookies in the response
    res.cookie("refreshToken", null, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });

    // Make sure the request body is initialized
    if (!req.body) {
      req.body = {};
    }

    // Set the refreshToken to null in request body to ensure it's not passed to the auth service
    req.body.refreshToken = null;
  } else {
    // Only add refreshToken if it's required (e.g., for authentication routes)

    if (
      req.url.includes("/refresh") ||
      req.url.includes("/checkauth") ||
      req.url.includes("/logout")
    ) {
      // Adjust condition based on your routes
      if (!req.body) {
        req.body = {};
      }
      req.body.refreshToken = refreshToken;
      logger.info("[Refresh Token] Refresh token added to request body");
    }
  }

  // Proceed to the next middleware (or proxy)
  next();
};

module.exports = { addRefreshTokenToRequestBody };
