const express = require("express");
const {
  sensitiveEndPointsLimiter,
} = require("../middlewares/sensitiveEndpointRatelimiter");

const {
  registerUser,
  loginUser,
  logoutUser,
  checkAuth,
  updateSubscription,
  toggleUserFavorites,
  getUserFavorites,
  getAccessDetails,
  updateWatchHistory,
  getWatchHistory,
  getWatchHistoryById,
  getContinueWatching,
  totalUsers,
  usersByRange,
  completeRegister,
  generateRegisterOTP,
  verifyLoginOTP,
  generateLoginOTP,
  getDeviceTokens,
  tvLoginInit,
  submitOTPLoginTV,
  checkPairingStatusTV,
  getUserById,
  getUserByEmail,
  getAllUsers,
} = require("../controllers/auth.controller");
const {
  checkAuthMiddleware,
  checkAdminAuthMiddleware,
} = require("../middlewares/checkAuthMiddleware");
const {
  createSupportTicket,
  getAllSupportTickets,
  getTicketById,
} = require("../controllers/support.controller");
const {
  getTopMovies,
  getTopTvSeries,
  getTopDocumentaries,
  getTopVideoSongs,
  getTopShortFilms,
  countUsersBySubscriptionType,
} = require("../controllers/analytics.controller");
const {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  checkAdminAuth,
  getAllAdmins,
  editAdminDetails,
} = require("../controllers/admin.controller");

const router = express.Router();

// router.post("/register", sensitiveEndPointsLimiter, registerUser);
router.post("/register", completeRegister);
router.post("/register/otp-generate", generateRegisterOTP);

// router.post("/login", loginUser);
router.post("/login", verifyLoginOTP);
router.post("/login/otp-generate", generateLoginOTP);
router.post("/tv/initiate", tvLoginInit);
router.post("/tv/submit-otp", submitOTPLoginTV);
router.get("/tv/pair-status", checkPairingStatusTV);

router.post("/logout", logoutUser);
// router.post("/refresh", getNewTokens);
router.get("/checkauth", checkAuth);
router.post("/updatesubscription", updateSubscription);

// Favorites
router.put("/favorites", checkAuthMiddleware, toggleUserFavorites);
router.get("/favorites", checkAuthMiddleware, getUserFavorites);

router.get("/access/:userId", getAccessDetails);

// Watch History
router.post("/history/update", checkAuthMiddleware, updateWatchHistory);

router.get("/history", checkAuthMiddleware, getWatchHistory);
router.get(
  "/history/:contentType/:contentId",
  checkAuthMiddleware,
  getWatchHistoryById
);

router.get("/continuewatching", checkAuthMiddleware, getContinueWatching);

// Help and Support
router.post("/support/ticket/new", createSupportTicket);
router.get("/support/ticket", getAllSupportTickets);
router.get("/support/ticket/:id", getTicketById);

// Analytics
router.get("/analytics/users", totalUsers);
router.get("/analytics/users/range", usersByRange);

// Top content by Watch History
router.get("/movies/top", getTopMovies);
router.get("/tvseries/top", getTopTvSeries);
router.get("/documentaries/top", getTopDocumentaries);
router.get("/videosongs/top", getTopVideoSongs);
router.get("/shortfilms/top", getTopShortFilms);

// Subscription types
router.get("/analytics/subscriptions", countUsersBySubscriptionType);

// Admin Routes
router.post("/admin/register", checkAdminAuthMiddleware, registerAdmin);
router.post("/admin/login", loginAdmin);
router.post("/admin/logout", logoutAdmin);
router.get("/admin/checkauth", checkAdminAuth);
router.get("/admin/all", getAllAdmins);
router.patch(
  "/admin/edit/:adminId",
  checkAdminAuthMiddleware,
  editAdminDetails
);
router.get("/admin/device-tokens", getDeviceTokens);
router.get("/admin/users/by-email/:email", getUserByEmail);
router.get("/admin/user/:userId", getUserById);

router.get("/admin/users", getAllUsers);

module.exports = router;
