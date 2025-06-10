const { Invoice } = require("../models/Invoice");
const { logger } = require("../utils/logger");
const ExcelJS = require("exceljs");

const getTransactionsByRange = async (req, res) => {
  logger.info("Get Transactions By Range Endpoint Hit...");
  try {
    const { startDate, endDate } = req.query;
    // Fetch Invoices
    const invoices = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    logger.warn("[Get Transactions By Range] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Download Excel
const exportTransactionsToExcel = async (req, res) => {
  logger.info("Export Transactions to Excel Endpoint Hit...");

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    // Fetch Invoices in range
    const invoices = await Invoice.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ createdAt: 1 });

    // Initialize workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transactions");

    // Define columns
    worksheet.columns = [
      { header: "Sl No.", key: "sl", width: 10 },
      { header: "Payment Date", key: "date", width: 20 },
      { header: "Invoice Number", key: "invoiceNumber", width: 25 },
      { header: "Transaction ID", key: "transactionId", width: 25 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Base Amount", key: "baseAmount", width: 15 },
      { header: "GST", key: "gst", width: 15 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "User Name", key: "userName", width: 20 },
      { header: "User Email", key: "userEmail", width: 25 },
      { header: "User Phone", key: "userPhone", width: 18 },
      { header: "User Pincode", key: "userPincode", width: 15 },
      {header: "User State", key: "userState", width: 15},
    ];

    // Add data rows
    invoices.forEach((invoice, index) => {
      // Calculate Base Amount, GST, and Total Amount
      const baseAmount = invoice.amount / 1.18;
      const gst = baseAmount * 0.18; // 18% of amount
      const totalAmount = invoice.amount; // Total is the same as the original amount

      worksheet.addRow({
        sl: index + 1,
        date: invoice.createdAt.toISOString().split("T")[0], // Format date to YYYY-MM-DD
        invoiceNumber: invoice.invoiceNumber,
        transactionId: invoice.transactionId,
        amount: invoice.amount,
        baseAmount: baseAmount.toFixed(2), // Format to 2 decimal places
        gst: gst.toFixed(2), // Format to 2 decimal places
        totalAmount: totalAmount.toFixed(2), // Format to 2 decimal places
        type: invoice.type,
        userName: invoice.user?.name || "",
        userEmail: invoice.user?.email || "",
        userPhone: invoice.user?.phone || "",
        userPincode: invoice.user?.pincode || "",
        userState: invoice.user?.state || "",
      });
    });

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=transactions.xlsx"
    );

    // Write and send workbook
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.warn("[Export Transactions to Excel] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getTransactionsByPinCode = async (req, res) => {
  logger.info("Get Transactions By Pin Code Endpoint Hit...");
  try {
    const { pinCode } = req.query;
    const { startDate, endDate } = req.query;
    // Fetch Invoices
    const invoices = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      "user.pincode": pinCode,
    });

    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    logger.warn("[Get Transactions By Pin Code] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getTransactionByType = async (req, res) => {
  logger.info("Get Transaction By Type Endpoint Hit...");
  try {
    const { type } = req.query;
    const { startDate, endDate } = req.query;
    const invoices = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      type: type,
    });

    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    logger.warn("[Get Transaction By Type] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getTopTenRented = async (req, res) => {
  logger.info("Get Top Rented Movie Sorted Endpoint Hit...");
  try {
    const { startDate, endDate } = req.query;

    // Aggregation pipeline to filter, group, and count the rentals by movieId
    const result = await Invoice.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate), // Make sure startDate is in Date format
            $lte: new Date(endDate), // Make sure endDate is in Date format
          },
          type: "Rental", // Only consider "Rental" type invoices
        },
      },
      {
        $group: {
          _id: "$rentalDetails.movieId", // Group by movieId
          count: { $sum: 1 }, // Count how many times this movieId appears (how many rentals)
        },
      },
      {
        $sort: { count: -1 }, // Sort by count in descending order
      },
      {
        $limit: 10, // Limit to top 10
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          movieId: "$_id", // Rename _id to movieId
          count: 1, // Include count
        },
      },
    ]);

    // Return the top 10 rented movies
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("Error fetching top rented movies", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching data" });
  }
};

const totalSubscriptions = async (req, res) => {
  logger.info("Get Total Subscriptions Endpoint Hit...");

  try {
    const total = await Invoice.countDocuments({ type: "Subscription" });

    return res.status(200).json({ success: true, total });
  } catch (error) {
    logger.warn("[Get Total Subscriptions] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const subscriptionsByRange = async (req, res) => {
  logger.info("Get Subscriptions By Range Endpoint Hit...");

  try {
    const { days } = req.query;
    const numDays = parseInt(days, 10);

    if (!numDays || isNaN(numDays) || numDays <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid days parameter" });
    }

    const dayInMs = 86400000;
    const today = new Date().setHours(0, 0, 0, 0);
    const currentStart = today - numDays * dayInMs;
    const previousStart = today - numDays * 2 * dayInMs;

    const currentTotal = await Invoice.countDocuments({
      type: "Subscription",
      createdAt: {
        $gte: new Date(currentStart),
        $lt: new Date(today),
      },
    });

    const previousTotal = await Invoice.countDocuments({
      type: "Subscription",
      createdAt: {
        $gte: new Date(previousStart),
        $lt: new Date(currentStart),
      },
    });

    let growth = null;
    if (previousTotal > 0) {
      growth = ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    return res.status(200).json({
      success: true,
      data: {
        currentTotal,
        previousTotal,
        growth: growth !== null ? growth.toFixed(2) : null,
      },
    });
  } catch (error) {
    logger.warn("[Get Subscriptions By Range] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const totalRentals = async (req, res) => {
  logger.info("Get Total Rentals Endpoint Hit...");

  try {
    const total = await Invoice.countDocuments({ type: "Rental" });

    return res.status(200).json({ success: true, total });
  } catch (error) {
    logger.warn("[Get Total Rentals] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const rentalsByRange = async (req, res) => {
  logger.info("Get Rentals By Range Endpoint Hit...");

  try {
    const { days } = req.query;
    const numDays = parseInt(days, 10);

    if (!numDays || isNaN(numDays) || numDays <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid days parameter" });
    }

    const dayInMs = 86400000;
    const today = new Date().setHours(0, 0, 0, 0);
    const currentStart = today - numDays * dayInMs;
    const previousStart = today - numDays * 2 * dayInMs;

    const currentTotal = await Invoice.countDocuments({
      type: "Rental",
      createdAt: {
        $gte: new Date(currentStart),
        $lt: new Date(today),
      },
    });

    const previousTotal = await Invoice.countDocuments({
      type: "Rental",
      createdAt: {
        $gte: new Date(previousStart),
        $lt: new Date(currentStart),
      },
    });

    let growth = null;
    if (previousTotal > 0) {
      growth = ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    return res.status(200).json({
      success: true,
      data: {
        currentTotal,
        previousTotal,
        growth: growth !== null ? growth.toFixed(2) : null,
      },
    });
  } catch (error) {
    logger.warn("[Get Rentals By Range] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getTransactionByThreeFilters = async (req, res) => {
  logger.info("Get Transaction By Three Filters Endpoint Hit...");
  try {
    const { startDate, endDate, pinCode, type } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    // Build dynamic query
    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (pinCode) {
      filter["user.pincode"] = pinCode;
    }

    if (type) {
      filter.type = type;
    }

    // Fetch invoices with dynamic filter
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    logger.warn("[Get Transaction By Three Filters] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getRevenueByState = async (req, res) => {
  logger.info("Get Revenue By State Endpoint Hit...");

  try {
    const { days, type } = req.query;
    // days = 0 All Time
    // days = 30 => 1 month, 90 = 3 Months, 180 = 6 Months, 365 = 1 Year

    if (!["Subscription", "Rental"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid invoice type" });
    }

    let matchCondition = { type };

    if (days && parseInt(days) > 0) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(days));
      matchCondition.createdAt = { $gte: fromDate };
    }

    const result = await Invoice.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$user.state",
          totalRevenue: { $sum: "$amount" },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.warn("[Get Revenue By State] Error Occurred", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  getTransactionsByRange,
  getTransactionsByPinCode,
  getTransactionByType,
  getTopTenRented,
  exportTransactionsToExcel,
  rentalsByRange,
  totalRentals,
  subscriptionsByRange,
  totalSubscriptions,
  getTransactionByThreeFilters,
  getRevenueByState,
};
