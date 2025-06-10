require("dotenv").config();
const Redis = require("ioredis");

// Initialize redis client with your Redis URL from environment variables
const redisClient = new Redis(process.env.REDIS_URL);

module.exports = { redisClient };
