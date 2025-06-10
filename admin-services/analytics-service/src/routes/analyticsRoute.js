const express = require("express");
const {
  getTransactionsByRange,
  getTransactionsByPinCode,
  getTransactionByType,
  getTopTenRented,
  totalSubscriptions,
  subscriptionsByRange,
  totalRentals,
  rentalsByRange,
  exportTransactionsToExcel,
  getTransactionByThreeFilters,
  getRevenueByState,
} = require("../controllers/transactionController");

const router = express.Router();

// router.get("/transactions")
router.get("/transactions", getTransactionsByRange);
router.get("/transactions/pincode", getTransactionsByPinCode);
router.get("/transactions/type", getTransactionByType);
router.get("/transactions/toprental", getTopTenRented);
router.get("/transactions/download", exportTransactionsToExcel);
router.get("/transactions/filter", getTransactionByThreeFilters);
router.get("/transactions/state", getRevenueByState);

// Analytics page
router.get("/rentals", totalRentals);
router.get("/rentals/date", rentalsByRange);
router.get("/rentals/top", getTopTenRented);
router.get("/subscriptions", totalSubscriptions);
router.get("/subscriptions/date", subscriptionsByRange);

module.exports = router;
