require("dotenv").config();

const urlVersion = (version) => async (req, res, next) => {
  if (req.path.startsWith(`/${version}`)) {
    const API_KEY = process.env[`API_TOKEN_${version.toUpperCase()}`];

    if (!API_KEY || req.headers["x-api-key"] !== API_KEY) {
      res
        .status(401)
        .json({ success: false, message: "API key is invalid or missing" });
      return;
    }
    req.headers["x-api-version"] = version;
    next();
  }

  // If the API version is not supported, return a 404 response
  return res.status(404).json({
    success: false,
    message: "API version is not supported",
  });
};

module.exports = { urlVersion };
