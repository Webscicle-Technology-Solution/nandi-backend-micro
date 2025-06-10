const { logger } = require("../utils/logger");

const proxyOptionsV1 = {
  proxyReqPathResolver: (req) => {
    // return req.originalUrl.replace(/^\/v1/, "/api"); //replace /v1/ with /api
    const modifiedUrl = req.originalUrl.replace(/^\/v1/, "/api");
    return modifiedUrl;
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy Error : ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  },
};

module.exports = { proxyOptionsV1 };
