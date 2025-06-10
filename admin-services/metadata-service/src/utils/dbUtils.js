const Genre = require("../models/Genre");
const Cast = require("../models/Cast");
const { validateGenre, validateCastDetails } = require("./validation");
const { logger } = require("./logger");
const { capitalizeFirst, capitalizeCastDetails } = require("./inputUtils");

const createOrAddGenre = async (name) => {
  try {
    name = capitalizeFirst(name);
    console.log(name);
    const genre = await Genre.findOne({ name });

    const { error } = validateGenre({ name });

    if (error) {
      logger.error("Validation Error", error.details[0].message);
      throw error;
    }

    if (!genre) {
      const newGenre = new Genre({ name });
      await newGenre.save();
      logger.info("[Create Genre] New Genre Created", newGenre._id);
      // Return the genre's ID as a string
      return newGenre._id.toString();
    }

    // If genre exists, return its ID as a string
    return genre._id.toString();
  } catch (error) {
    logger.error("[Create/Add Genre] Error Occurred", error);
    throw error;
  }
};

const updateOrCreateCastDetails = async (
  castDetails,
  Model,
  idField,
  actualId
) => {
  // Capitalize cast details before processing
  castDetails = capitalizeCastDetails(castDetails);

  // Use the provided Model to find the entity by its actual ID
  const entity = await Model.findById(actualId);

  if (!entity) {
    throw new Error(`${Model.modelName} not found`); // Handle the error case where the entity is not found
  }

  // Now handle cast details
  const cast = await Cast.findOne({ [idField]: entity._id });

  if (!cast) {
    // If no cast exists, create a new one
    const newCast = await Cast.create({
      [idField]: entity._id, // Attach the correct ID dynamically
      actors: castDetails.actors || [],
      producers: castDetails.producers || [],
      directors: castDetails.directors || [],
      singers: castDetails.singers || [],
      writers: castDetails.writers || [],
      composers: castDetails.composers || [],
    });

    // Assign the new cast to the entity
    entity.castDetails = newCast._id;
    logger.info("[Create Cast] New Cast Created", newCast._id);
  } else {
    // If cast exists, update the fields
    if (castDetails.actors) cast.actors = castDetails.actors;
    if (castDetails.producers) cast.producers = castDetails.producers;
    if (castDetails.directors) cast.directors = castDetails.directors;
    if (castDetails.singers) cast.singers = castDetails.singers;
    if (castDetails.writers) cast.writers = castDetails.writers;
    if (castDetails.composers) cast.composers = castDetails.composers;

    await cast.save(); // Save updated cast details
  }

  await entity.save(); // Ensure the entity itself is saved after cast details update
};

const createCastDetails = async (castDetails, idField, actualId) => {
  castDetails = capitalizeCastDetails(castDetails);
  // Use the provided Model to find the entity by its actual ID

  const newCast = await Cast.create({
    [idField]: actualId, // Attach the correct ID dynamically
    actors: castDetails.actors || [],
    producers: castDetails.producers || [],
    directors: castDetails.directors || [],
    singers: castDetails.singers || [],
    writers: castDetails.writers || [],
    composers: castDetails.composers || [],
  });

  logger.info("[Create Cast] New Cast Created", newCast._id);

  return newCast._id;
};

module.exports = {
  createOrAddGenre,
  updateOrCreateCastDetails,
  createCastDetails,
};
