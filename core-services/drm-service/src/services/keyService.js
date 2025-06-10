const crypto = require("crypto");
const DRMKey = require("../models/DRMKeys");
const { logger } = require("../utils/logger");
const argon2 = require("argon2");

const generateDRMKeysForMovie = async (movieId, totalSegments) => {
  let keyIds = [];

  for (let i = 0; i < totalSegments; i++) {
    const keyId = crypto.randomUUID();
    const encryptionKey = crypto.randomBytes(16).toString("hex"); // ✅ Store as HEX
    const iv = crypto.randomBytes(16).toString("hex"); // ✅ Already in HEX

    await DRMKey.create({ movieId, segmentIndex: i, keyId, encryptionKey, iv });

    keyIds.push(keyId);
  }

  logger.info(`✅ DRM Keys Generated for ${movieId}:`, keyIds);
  return keyIds;
};

const getEncryptedKeyForUser = async (keyId, userId, redisClient) => {
  if (!redisClient) {
    throw new Error("[getEncryptedKeyForUser] ❌ Redis client is undefined!");
  }

  const drmKey = await DRMKey.findOne({ keyId });
  if (!drmKey) {
    logger.error(
      `[getEncryptedKeyForUser] ❌ Key not found for keyId: ${keyId}`
    );
    throw new Error("Key not found");
  }

  let sessionKeyData = await redisClient.get(`sessionKey:${userId}`);

  if (!sessionKeyData) {
    // ✅ Generate New Valid 16-byte Session Key
    await redisClient.del(`sessionKey:${userId}`);
    const sessionKey = crypto.randomBytes(16).toString("hex"); // ✅ 32 hex characters (16 bytes)
    const expiresAt = Date.now() + 10 * 60 * 1000; // ⏳ Expires in 10 minutes

    // ✅ Store Correctly in Redis
    sessionKeyData = JSON.stringify({
      sessionKey, // ✅ Store raw 16-byte session key
      expiresAt,
    });

    await redisClient.setex(`sessionKey:${userId}`, 600, sessionKeyData);
    logger.info(
      `🔄 New session key generated for user ${userId}: ${sessionKey}`
    );
  } else {
    logger.info(`✅ Using existing session key for user ${userId}`);
  }

  sessionKeyData = JSON.parse(sessionKeyData);
  const { sessionKey } = sessionKeyData; // ✅ Ensure correct retrieval

  if (!sessionKey || sessionKey.length !== 32) {
    logger.error(`❌ Invalid session key retrieved from Redis: ${sessionKey}`);
    throw new Error("Invalid session key retrieved from Redis");
  }

  // 🔐 **Encrypt AES-128 Key with the Correct Session Key**
  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    Buffer.from(sessionKey, "hex"), // ✅ Properly formatted session key
    Buffer.alloc(16, 0)
  );
  let encryptedKey = cipher.update(drmKey.encryptionKey, "base64", "base64");
  encryptedKey += cipher.final("base64");

  return {
    sessionKeyId: crypto.randomUUID(),
    encryptedKey,
    sessionKey, // ✅ Now sending the raw session key to the client
    sessionExpiresAt: sessionKeyData.expiresAt,
  };
};

module.exports = { generateDRMKeysForMovie, getEncryptedKeyForUser };
