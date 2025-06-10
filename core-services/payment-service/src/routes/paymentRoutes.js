const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  getSubscriptionTypes,
  newSubscription,
  getUserSubscription,
  subscribePlan,
  checkPaymentStatus,
  rentMovie,
  getUserRentals,
  getActiveRentals,
  getTransactions,
  getTransactionById,
  searchTransactions,
} = require("../controllers/paymentController");

router.get("/subscription/types", getSubscriptionTypes);
router.post("/subscription", newSubscription);
router.get("/subscription/:userId", getUserSubscription);
router.post("/subscribe/:planName", subscribePlan);

router.get("/transactions/status", checkPaymentStatus);
router.get("/transactions", getTransactions);
router.get("/transactions/search", searchTransactions);
router.get("/transactions/:id", getTransactionById);

router.post("/rent/movie/:movieId", rentMovie);
router.get("/rentals", getUserRentals);
router.get("/rentals/active", getActiveRentals);

module.exports = router;
