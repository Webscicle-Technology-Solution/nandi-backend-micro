const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { logger } = require("../utils/logger");
const { redisClient } = require("./redisConfig");

// Rate Limiting
const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler(req, res) {
    logger.warn(`Sensitive endpoint limit exceeded for IP : ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = { ratelimitOptions };
