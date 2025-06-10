const { logger } = require("../utils/logger");
const Cast = require("../models/Cast");
const { validateMongoId } = require("../utils/validation");

const getCastDetails = async (req, res) => {
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const cast = await Cast.findById(req.params.id);
    if (!cast) {
      logger.warn(`Cast with id ${req.params.id} not found`);
      return res
        .status(404)
        .json({ success: false, message: "Cast not found" });
    }

    logger.info("[Get Cast Details] Successful");
    res.status(200).json({ success: true, cast });
  } catch (e) {
    logger.error("[Get Cast Details] Error Occured", e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { getCastDetails };
