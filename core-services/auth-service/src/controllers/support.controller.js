const { logger } = require("../utils/logger");
const SupportTicket = require("../models/SupportTicket");

const createSupportTicket = async (req, res) => {
  logger.info(`Create Support Ticket Endpoint Hit...`);
  try {
    const userId = req.body?.user?.userId || req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized, Login to Proceed!" });
    }
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Please provide a message" });
    }

    const supportTicket = new SupportTicket({
      user: userId,
      message,
    });

    await supportTicket.save();

    return res.status(200).json({ success: true, data: supportTicket });
  } catch (error) {
    logger.error("[Create Support Ticket] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getAllSupportTickets = async (req, res) => {
  logger.info(`Get All Support Tickets Endpoint Hit...`);
  try {
    const supportTickets = await SupportTicket.find({})
      .sort({ createdAt: -1 })
      .populate("user", "name email phoneNumber");
    return res.status(200).json({ success: true, data: supportTickets });
  } catch (error) {
    logger.error("[Get All Support Tickets] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getTicketById = async (req, res) => {
  logger.info(`Get Ticket By Id Endpoint Hit...`);
  try {
    const { id } = req.params;
    const supportTicket = await SupportTicket.findById(id).populate("user");
    if (!supportTicket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }
    return res.status(200).json({ success: true, data: supportTicket });
  } catch (error) {
    logger.error("[Get Ticket By Id] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const updateTicketById = async (req, res) => {
  logger.info(`Update Ticket By Id Endpoint Hit...`);
  try {
    const { id } = req.params;
    const supportTicket = await SupportTicket.findById(id);
    if (!supportTicket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Please provide a message" });
    }
    supportTicket.status = status;
    await supportTicket.save();
    return res.status(200).json({ success: true, data: supportTicket });
  } catch (error) {
    logger.error("[Update Ticket By Id] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createSupportTicket,
  getAllSupportTickets,
  getTicketById,
  updateTicketById,
};
