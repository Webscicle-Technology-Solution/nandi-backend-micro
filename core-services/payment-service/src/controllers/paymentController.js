const SubscriptionType = require("../models/SubscriptionTypes");
const Subscription = require("../models/Subscriptions");
const mongoose = require("mongoose");
const { logger } = require("../utils/logger");
const { initiatePayment } = require("../services/paymentService");
const { v4: uuidv4 } = require("uuid");
const Transaction = require("../models/Transactions");
const axios = require("axios");
const Rental = require("../models/Rental");

// Fetch all Subscription Types (Free, Silver, Gold)
const getSubscriptionTypes = async (req, res) => {
  logger.info("Get Subscription Types Endpoint Hit...");
  try {
    // Fetch all sub types
    const subscriptionTypes = await SubscriptionType.find({}).sort({
      createdAt: 1,
    });
    return res.status(200).json({ success: true, data: subscriptionTypes });
  } catch (error) {
    logger.warn("[Get Subscription Types] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Create Subscription of SubscriptionType for a User
const newSubscription = async (req, res) => {
  logger.info("Create User Subscription Endpoint Hit...");
  try {
    const { subscriptionName, userId, paymentId, status } = req.body;
    if (!subscriptionName || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing Subscription Name or User Id",
      });
    }

    // if (paymentId) {
    //   const payment = await Payment.findById(paymentId);
    //   if (!payment) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Invalid Payment Id",
    //     });
    //   }
    // }

    if (status) {
      if (
        status !== "Pending" &&
        status !== "Active" &&
        status !== "Cancelled" &&
        status !== "Expired"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Status",
        });
      }
    }

    const subType = await SubscriptionType.findOne({ name: subscriptionName });

    if (!subType) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subscription Name",
      });
    }

    const subscription = new Subscription({
      subscriptionType: subType._id,
      user: userId,
      status: status ? status : "Pending",
      paymentId: paymentId ? paymentId : null,
    });
    await subscription.save();
    return res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    logger.warn("[Create User Subscription] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get Subscription of A User by UserId
const getUserSubscription = async (req, res) => {
  logger.info("Get User Subscription Endpoint Hit...");
  try {
    const { userId } = req.params;
    if (!userId) {
      logger.warn("[Get User Subscription] Missing User Id");
      return res.status(400).json({
        success: false,
        message: "Missing User Id",
      });
    }
    // const subscription = await Subscription.findOne({ user: userId });
    // Find all subscriptions of user sorted by createdeAt and find the latest one where status is Active
    const subscription = await Subscription.findOne({
      user: userId,
      status: "Active",
    })
      .populate("subscriptionType")
      .sort({ createdAt: -1 });
    if (!subscription) {
      logger.warn("[Get User Subscription] Invalid User Id");
      return res.status(400).json({
        success: false,
        message: "Invalid User Id",
      });
    } else {
      logger.info("[Get User Subscription] Subscription Found", subscription);
      return res.status(200).json({ success: true, data: subscription });
    }
  } catch (error) {
    logger.warn("[Get User Subscription] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Initiate new subscription Plan, Transaction
const subscribePlan = async (req, res) => {
  logger.info("Subscribe Plan Endpoint Hit...");
  try {
    // const phoneno = Number(req.body.phone);
    // const phoneno = "+919744992464";
    // if (!phoneno) {
    //   logger.warn("[Subscribe Plan] Missing Phone No");
    //   return res.status(400).json({
    //     success: false,
    //     message: "Missing Phone No",
    //   });
    // }
    const user = req.body.user;
    // logger.info("[Subscribe Plan] User Found", JSON.stringify(user));
    const userId = user?.userId;
    if (!userId) {
      logger.warn("[Subscribe Plan] Missing User Id");
      return res.status(400).json({
        success: false,
        message: "Please login to subscribe to a plan",
      });
    }
    const planName = req.params.planName;
    if (!planName) {
      logger.warn("[Subscribe Plan] Missing Plan Name");
      return res.status(400).json({
        success: false,
        message: "Missing Plan Name",
      });
    }

    if (planName === "Free") {
      logger.warn("[Subscribe Plan] Free Plan is not allowed");
      return res.status(400).json({
        success: false,
        message: "Free Plan is not allowed",
      });
    }

    const redirectUrl = req.body.redirectUrl;
    if (!redirectUrl) {
      logger.warn("[Subscribe Plan] Missing Redirect Url");
      return res.status(400).json({
        success: false,
        message: "Missing Redirect Url",
      });
    }

    const subscriptionType = await SubscriptionType.findOne({
      name: planName,
    });

    if (!subscriptionType) {
      logger.warn("[Subscribe Plan] Invalid Plan Name");
      return res.status(400).json({
        success: false,
        message: "Invalid Plan Name",
      });
    }

    let price = subscriptionType.price;

    const userSubscription = await Subscription.findOne({
      user: userId,
      status: "Active",
    })
      .populate("subscriptionType")
      .sort({ createdAt: -1 });

    // Validate subscription upgrades
    if (userSubscription) {
      // 1. Check if user is on Gold
      if (userSubscription.subscriptionType.name === "Gold") {
        logger.warn("[Subscribe Plan] User is already on Gold Plan");
        return res.status(400).json({
          success: false,
          message: "User is already on Gold Plan",
        });
      }

      // 2. Check if user is on Silver
      if (userSubscription.subscriptionType.name === "Silver") {
        // Check if plan is Silver
        if (subscriptionType.name === "Silver") {
          logger.warn("[Subscribe Plan] User is already on Silver Plan");
          return res.status(400).json({
            success: false,
            message: "User is already on Silver Plan",
          });
        }
      }

      // Handle Upgrade Logic from Silver to Gold
      if (
        userSubscription.subscriptionType.name === "Silver" &&
        subscriptionType.name === "Gold"
      ) {
        // Calculate remaining date till expiry of existing plan
        const remainingDays = userSubscription.endDate - Date.now();

        // Validate that remainingDays is a positive number
        if (isNaN(remainingDays) || remainingDays < 0) {
          // Handle the case where remainingDays is invalid (e.g., set to 0 or throw an error)
          throw new Error("Invalid expiry date for existing subscription");
        }

        const days = Math.ceil(remainingDays / (1000 * 60 * 60 * 24)); // Convert to days

        // Validate that days is a valid number
        if (isNaN(days) || days <= 0) {
          // Handle invalid days (e.g., set to a default value or throw an error)
          throw new Error("Invalid number of days calculated");
        }

        // Calculate per day rate of existing plan and find total amount to be paid
        const perDayRate = userSubscription.subscriptionType.price / 30;

        // Validate that perDayRate is a valid number
        if (isNaN(perDayRate) || perDayRate <= 0) {
          throw new Error("Invalid per-day rate calculation");
        }

        const totalAmount = perDayRate * days;

        // Validate that totalAmount is a valid number
        if (isNaN(totalAmount) || totalAmount < 0) {
          throw new Error("Invalid total amount calculated");
        }

        // Subtract from the price of new plan
        const finalAmount = Number(subscriptionType.price - totalAmount);

        // Validate that finalAmount is a valid number
        if (isNaN(finalAmount) || finalAmount < 0) {
          throw new Error("Invalid final amount calculated");
        }

        price = finalAmount;
      }
    }

    // Generate new Transaction in DB
    const transaction = await Transaction.create({
      user: userId,
      type: "SubscriptionType",
      typeId: subscriptionType._id,
      paymentDate: Date.now(),
      paymentAmount: price * 1.18, //add 18% GST
    });

    const paymentResponse = await initiatePayment({
      amount: price * 100 * 1.18, //Converet to paise and add 18% GST
      redirectUrl: `${redirectUrl}/${transaction._id}`,
      merchantTransactionId: transaction._id,
      merchantUserId: userId,
      message: `Subscribe to ${planName} Plan`,
    });
    logger.info("[Subscribe Plan] Payment Response", paymentResponse);
    if (paymentResponse.response.success) {
      return res.status(200).json({
        success: true,
        data: { paymentUrl: paymentResponse.paymentUrl },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to Initialize Payment. Try Again Later.",
      });
    }
  } catch (error) {
    logger.warn("[Subscribe Plan] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const rentMovie = async (req, res) => {
  logger.info("Rent Movie Endpoint Hit...");
  try {
    const { movieId } = req.params;
    const user = req.body?.user;
    const userId = user?.userId;
    const redirectUrl = req.body?.redirectUrl;
    if (!redirectUrl) {
      logger.warn("[Rent Movie] Missing Redirect Url");
      return res.status(400).json({
        success: false,
        message: "Missing Redirect Url",
      });
    }
    if (!userId) {
      logger.warn("[Rent Movie] Missing User Id");
      return res.status(400).json({
        success: false,
        message: "Please login to subscribe to a plan",
      });
    }

    // Fetch movie from metadata service
    const response = await axios.get(
      `${process.env.ADMIN_METADATA_SERVICE_URL}/api/admin/meta/movies/${movieId}`
    );

    if (response.status !== 200) {
      return res.status(400).json({
        success: false,
        message: "Invalid Movie Id",
      });
    }

    const movie = response.data.movie;

    if (movie.accessParams.isRentable === false) {
      return res.status(400).json({
        success: false,
        message: "Movie is not rentable",
      });
    }

    // Check if user already has an active rental for this movie
    const nowLocal = new Date();
    const nowUTC = new Date(
      nowLocal.getTime() - nowLocal.getTimezoneOffset() * 60000
    );
    const existingRental = await Rental.findOne({
      user: userId,
      movie: movie._id,
      status: "Active",
      endDate: { $gte: nowUTC },
    });

    if (existingRental) {
      return res.status(400).json({
        success: false,
        message: "You already have an active rental for this movie",
      });
    }

    const transaction = await Transaction.create({
      user: userId,
      type: "Rental",
      typeId: movie._id,
      paymentDate: Date.now(),
      paymentAmount: movie.accessParams.rentalPrice * 1.18, //add 18% GST and convert to paise
    });

    const paymentResponse = await initiatePayment({
      amount: movie.accessParams.rentalPrice * 1.18 * 100,
      redirectUrl: `${redirectUrl}/${transaction._id}`,
      merchantTransactionId: transaction._id,
      merchantUserId: userId,
      message: `Rent Movie ${movie.title}`,
    });

    logger.info("[Rent Movie] Payment Response", paymentResponse);
    if (paymentResponse.response?.success) {
      return res.status(200).json({
        success: true,
        data: { paymentUrl: paymentResponse.paymentUrl },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to Initialize Payment. Try Again Later.",
      });
    }
  } catch (error) {
    logger.warn("[Rent Movie] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get User Rentals
const getUserRentals = async (req, res) => {
  logger.info("Get User Rentals Endpoint Hit...");
  try {
    const { userId } = req.params;
    const rentals = await Rental.find({ user: userId });
    return res.status(200).json({ success: true, data: rentals });
  } catch (error) {
    logger.warn("[Get User Rentals] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// get active rentals only
const getActiveRentals = async (req, res) => {
  logger.info("Get User Active Rentals Endpoint Hit...");
  try {
    // const { userId } = req.params;
    const user = req.body?.user;
    const userId = user?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Please login to get active rentals",
      });
    }
    // Find rentals by status active and expiry date less equals than current date time
    // logger.info(`Attempting to find rentals for user ${userId}`);
    const nowLocal = new Date();
    const nowUTC = new Date(
      nowLocal.getTime() - nowLocal.getTimezoneOffset() * 60000
    );
    const rentals = await Rental.find({
      user: userId,
      status: "Active",
      endDate: { $gte: nowUTC },
    });
    return res.status(200).json({ success: true, data: rentals });
  } catch (error) {
    logger.warn("[Get User Rentals] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const checkPaymentStatus = async (req, res) => {
  logger.info("Check Payment Status Endpoint Hit...");
  try {
    const { transactionId, item } = req.query;
    logger.info(
      `[Check Payment Status] Transaction Id: ${transactionId}, Item: ${item}`
    );
    const transaction = await Transaction.findById(transactionId).populate(
      "typeId"
    );
    if (!transaction) {
      logger.warn("[Check Payment Status] Invalid Transaction Id");
      return res.status(400).json({
        success: false,
        message: "Invalid Transaction Id",
      });
    }
    return res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    logger.warn("[Check Payment Status] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Get transactions with pagination, sorting and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with transactions data
 */
const getTransactions = async (req, res) => {
  logger.info("Get Transactions Endpoint Hit...");
  try {
    // Extract query parameters
    const {
      sortBy = "paymentDate",
      sortOrder = "desc",
      userId,
      type,
      status,
      fromDate,
      toDate,
    } = req.query;

    // Build filter object
    const filter = {};

    // Add dynamic filters if provided
    if (userId) filter.user = userId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    // Add date range filter if provided
    if (fromDate || toDate) {
      filter.paymentDate = {};
      if (fromDate) filter.paymentDate.$gte = new Date(fromDate);
      if (toDate) filter.paymentDate.$lte = new Date(toDate);
    }

    // Pagination setup (matching searchMovieController style)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Determine sort direction
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination (no population since refs are in another DB)
    const transactions = await Transaction.find(filter)
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    // Get total count for pagination metadata
    const totalTransactions = await Transaction.countDocuments(filter);

    const result = {
      transactions: transactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions,
    };

    return res.status(200).json({
      success: true,
      results: result,
    });
  } catch (error) {
    logger.warn("[Get Transactions] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Get transaction by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with transaction data
 */
const getTransactionById = async (req, res) => {
  logger.info("Get Transaction By ID Endpoint Hit...");
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    logger.warn("[Get Transaction By ID] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Search transactions by email or transaction ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with transaction data
 */
const searchTransactions = async (req, res) => {
  logger.info("Search Transactions Endpoint Hit...");
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required and must be a valid string",
      });
    }

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const sortBy = req.query.sortBy || "paymentDate";
    const sortOrder = req.query.sortOrder || "desc";

    // Determine sort direction
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Check if query is an email using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(query);

    let transactions = [];
    let totalTransactions = 0;

    if (isEmail) {
      // If email, fetch userId from user service
      logger.info(`Fetching user ID for email: ${query}`);
      try {
        // Call user service with query parameters instead of path params
        const userServiceResponse = await axios.get(
          `${process.env.AUTH_SERVICE_URL}/api/auth/admin/users/by-email/${query}`,
        );

        if (
          userServiceResponse.data &&
          userServiceResponse.data.success &&
          userServiceResponse.data.user
        ) {
          const userId = userServiceResponse.data.user._id;

          // Find transactions by userId
          logger.info(`Searching transactions for user ID: ${userId}`);
          transactions = await Transaction.find({ user: userId })
            .sort(sort)
            .skip(startIndex)
            .limit(limit);

          totalTransactions = await Transaction.countDocuments({
            user: userId,
          });
        } else {
          logger.warn(`No user found with email: ${query}`);
          return res.status(404).json({
            success: false,
            message: "No user found with the provided email",
          });
        }
      } catch (error) {
        logger.error("Error while fetching user from user service", error);
        return res.status(500).json({
          success: false,
          message: "Error while fetching user information",
        });
      }
    } else {
      // If not email, try to find transaction by ID
      logger.info(`Searching for transaction by ID: ${query}`);

      // Check if query is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(query)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction ID format",
        });
      }

      try {
        const transaction = await Transaction.findById(query);

        if (transaction) {
          transactions = [transaction];
          totalTransactions = 1;
        } else {
          logger.warn(`No transaction found with ID: ${query}`);
          return res.status(404).json({
            success: false,
            message: "No transaction found with the provided ID",
          });
        }
      } catch (error) {
        logger.error("Error while finding transaction by ID", error);
        return res.status(500).json({
          success: false,
          message: "Error while searching for transaction",
        });
      }
    }

    const result = {
      transactions: transactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions,
    };

    return res.status(200).json({
      success: true,
      results: result,
    });
  } catch (error) {
    logger.warn("[Search Transactions] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
module.exports = {
  getSubscriptionTypes,
  newSubscription,
  getUserSubscription,
  subscribePlan,
  rentMovie,
  checkPaymentStatus,
  getUserRentals,
  getActiveRentals,
  getTransactions,
  getTransactionById,
  searchTransactions,
};
