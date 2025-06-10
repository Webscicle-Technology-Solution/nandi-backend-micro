const JoiBase = require("joi");
const JoiDate = require("@joi/date");
const Joi = JoiBase.extend(JoiDate); // Extend Joi with the date plugin

const dateRequired = (fields, message) => {
  const schema = {};
  fields.forEach((field) => {
    schema[field] = Joi.date()
      .format("DD/MM/YYYY")
      .messages({ "date.format": message })
      .allow(null)
      .optional();
  });

  return Joi.object(schema); // ✅ This must return a Joi object
};

const validateCreateMovie = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    certificate: Joi.string().max(10).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1).allow(null, "")).optional(),
      producers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      directors: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      singers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      writers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      composers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
    })
      .allow(null)
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    trailerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    previewId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
    accessParams: Joi.object({
      accessType: Joi.string()
        .valid("free", "rentable", "subscription-only")
        .allow(null, "")
        .optional(),
      isRentable: Joi.boolean().allow(null).optional(),
      isFree: Joi.boolean().allow(null).optional(),
      requiredSubscriptionType: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .allow(null, "")
        .optional(),
      rentalPrice: Joi.number().min(0).allow(null).optional(),
    })
      .allow(null)
      .optional(),
    createdAt: Joi.date().allow(null).optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateMongoId = (data) => {
  const schema = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(), // Optional, assuming ObjectId for Cast
  }).unknown(true);

  return schema.validate(data);
};

const validateEditMovie = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).allow(null, "").optional(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    certificate: Joi.string().max(10).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1).allow(null, "")).optional(),
      producers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      directors: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      singers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      writers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      composers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
    })
      .allow(null)
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    trailerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    previewId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
    accessParams: Joi.object({
      accessType: Joi.string()
        .valid("free", "rentable", "subscription-only")
        .allow(null, "")
        .optional(),
      isRentable: Joi.boolean().allow(null).optional(),
      isFree: Joi.boolean().allow(null).optional(),
      rentalDuration: Joi.number().min(0).allow(null).optional(),
      expiringHour: Joi.number().min(0).allow(null).optional(),
      requiredSubscriptionType: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .allow(null, "")
        .optional(),
      rentalPrice: Joi.number().min(0).allow(null).optional(),
    })
      .allow(null)
      .optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data); // 🔥 Merge schemas correctly
};

const validateCreateDocumentary = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1).allow(null, "")).optional(),
      producers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      directors: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      singers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      writers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      composers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
    })
      .allow(null)
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
    createdAt: Joi.date().allow(null).optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateEditDocumentary = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).allow(null, "").optional(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1).allow(null, "")).optional(),
      producers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      directors: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      singers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      writers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      composers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
    })
      .allow(null)
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateCreateShortFilm = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1).allow(null, "")).optional(),
      producers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      directors: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      singers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      writers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      composers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
    })
      .allow(null)
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
    createdAt: Joi.date().allow(null).optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateEditShortFilm = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).allow(null, "").optional(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1).allow(null, "")).optional(),
      producers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      directors: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      singers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      writers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      composers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
    })
      .allow(null)
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateCreateVideoSong = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000).optional(), // Optional, with a max length
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1)).optional(),
      producers: Joi.array().items(Joi.string().min(1)).optional(),
      directors: Joi.array().items(Joi.string().min(1)).optional(),
      singers: Joi.array().items(Joi.string().min(1)).optional(),
      writers: Joi.array().items(Joi.string().min(1)).optional(),
      composers: Joi.array().items(Joi.string().min(1)).optional(),
    }).optional(), // Now validating castDetails as an object of the desired structure
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(), // Optional, ObjectId for Poster
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(), // Optional, ObjectId for Banner
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(), // Optional, ObjectId for Video
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled") // Ensure status is one of these values
      .default("draft") // Default to 'draft' if no value is provided
      .optional(), // Optional field
    createdAt: Joi.date().allow(null).optional(), // Optional, if the client doesn't send this field
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateEditVideoSong = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).allow(null, "").optional(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array()
        .items(Joi.string().allow("")) // No min length, allowing empty strings
        .allow(null, "")
        .optional(),
      producers: Joi.array()
        .items(Joi.string().allow("")) // No min length, allowing empty strings
        .allow(null, "")
        .optional(),
      directors: Joi.array()
        .items(Joi.string().allow("")) // No min length, allowing empty strings
        .allow(null, "")
        .optional(),
      singers: Joi.array()
        .items(Joi.string().allow("")) // No min length, allowing empty strings
        .allow(null, "")
        .optional(),
      writers: Joi.array()
        .items(Joi.string().allow("")) // No min length, allowing empty strings
        .allow(null, "")
        .optional(),
      composers: Joi.array()
        .items(Joi.string().allow("")) // No min length, allowing empty strings
        .allow(null, "")
        .optional(),
    })
      .allow(null, "")
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .allow(null, "")
      .optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateCreateTVSeries = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1).allow(null, "")).optional(),
      producers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      directors: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      singers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      writers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      composers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
    })
      .allow(null)
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
    createdAt: Joi.date().allow(null).optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateEditTVSeries = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).allow(null, "").optional(),
    description: Joi.string().max(1000).allow(null, "").optional(),
    genre: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    castDetails: Joi.object({
      actors: Joi.array().items(Joi.string().min(1).allow(null, "")).optional(),
      producers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      directors: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      singers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      writers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
      composers: Joi.array()
        .items(Joi.string().min(1).allow(null, ""))
        .optional(),
    })
      .allow(null)
      .optional(),
    posterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    bannerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateCreateSeason = (data) => {
  const baseSchema = Joi.object({
    seasonNumber: Joi.number().min(1).required(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional()
      .allow(null, ""),
    createdAt: Joi.date().allow(null).optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateEditSeason = (data) => {
  const baseSchema = Joi.object({
    seasonNumber: Joi.number().min(1).optional(),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional()
      .allow(null, ""),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateCreateEpisode = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).optional().allow(null, ""),
    description: Joi.string().max(1000).optional(),
    episodeNumber: Joi.number().min(1).required(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(), // ObjectId for Video
    seasonId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(), // Required ObjectId for Season
    tvSeriesId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(), // Required ObjectId for TVSeries
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional(),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateEditEpisode = (data) => {
  const baseSchema = Joi.object({
    title: Joi.string().min(3).max(100).optional().allow(null, ""),
    description: Joi.string().max(1000).optional().allow(null, ""),
    episodeNumber: Joi.number().min(1).required(),
    videoId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .allow(null, ""),
    seasonId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .allow(null, ""),
    tvSeriesId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .allow(null, ""),
    status: Joi.string()
      .valid("active", "inactive", "draft", "scheduled")
      .default("draft")
      .optional()
      .allow(null, ""),
  }).unknown(true);

  const dateSchema = dateRequired(
    ["releaseDate", "publishDate"],
    "Invalid date format, expected DD/MM/YYYY"
  );

  return baseSchema.concat(dateSchema).validate(data);
};

const validateCastDetails = (data) => {
  const schema = Joi.object({
    actors: Joi.array().items(Joi.string().min(1)).optional(), // Array of actor names
    producers: Joi.array().items(Joi.string().min(1)).optional(), // Array of producer names
    directors: Joi.array().items(Joi.string().min(1)).optional(), // Array of director names
    singers: Joi.array().items(Joi.string().min(1)).optional(), // Array of singer names
    writers: Joi.array().items(Joi.string().min(1)).optional(), // Array of writer names
    composers: Joi.array().items(Joi.string().min(1)).optional(), // Array of composer names
  }).unknown(true);

  return schema.validate(data);
};

const validateGenre = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
  }).unknown(true);

  return schema.validate(data);
};

module.exports = {
  validateMongoId,
  validateCreateMovie,
  validateEditMovie,
  validateCreateDocumentary,
  validateEditDocumentary,
  validateCreateShortFilm,
  validateEditShortFilm,
  validateCreateVideoSong,
  validateEditVideoSong,
  validateCreateTVSeries,
  validateEditTVSeries,
  validateCreateSeason,
  validateEditSeason,
  validateCreateEpisode,
  validateEditEpisode,
  validateGenre,
  validateCastDetails,
};
