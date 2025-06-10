const mongoose = require("mongoose");

const invoiceCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true }, // Store the year (e.g., 2025)
  sequence: { type: Number, required: true, default: 0 }, // The sequence number for the year
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    year: { type: Number },
    month: { type: Number, min: 1, max: 12 },
    day: { type: Number, min: 1, max: 31 },
    transactionId: { type: String },
    amount: { type: Number },
    type: { type: String, enum: ["Subscription", "Rental"] },
    subscriptionDetails: {
      planName: { type: String },
      subscriptionTypeId: { type: String },
      subscriptionId: { type: String },
    },
    rentalDetails: {
      movieId: { type: String },
      rentalId: { type: String },
    },
    user: {
      state: { type: String },
      pincode: { type: String },
      email: { type: String },
      phone: { type: String },
      name: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate the invoice number
invoiceSchema.pre("save", async function (next) {
  const currentYear = new Date().getFullYear(); // Get the current year (e.g., 2025)

  // If the year is not already set, set it to the current year
  if (!this.year) {
    this.year = currentYear;
  }

  if (!this.month) {
    this.month = new Date().getMonth() + 1;
  }

  if (!this.day) {
    this.day = new Date().getDate();
  }

  // Fetch the last sequence number for the current year
  const counter = await InvoiceCounter.findOne({ year: this.year });

  if (!counter) {
    // If no counter exists for the current year, create a new one
    await InvoiceCounter.create({ year: this.year, sequence: 1 });
    this.invoiceNumber = `NAN-${this.year}-0001`; // Set invoice number for the first invoice
  } else {
    // Increment the sequence number
    const newSequence = counter.sequence + 1;
    this.invoiceNumber = `NAN-${this.year}-${String(newSequence).padStart(
      4,
      "0"
    )}`; // e.g., NAN-2025-0002

    // Update the counter for the current year
    counter.sequence = newSequence;
    await counter.save();
  }

  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
const InvoiceCounter = mongoose.model("InvoiceCounter", invoiceCounterSchema);

module.exports = { Invoice, InvoiceCounter };
