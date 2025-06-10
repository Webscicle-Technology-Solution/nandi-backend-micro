// const express = require('express');
// const mongoose = require('mongoose');
// const notificationRoutes = require('./routes/notificationRoutes');
// require('dotenv').config();

// // Start Cron Job
// require('./jobs/notificationScheduler');

// const app = express();
// app.use(express.json());

// // MongoDB Connection
// mongoose.connect(process.env.MONGO_URI);

// // Routes
// app.use('/api/notifications', notificationRoutes);

// const PORT = process.env.PORT || 3015;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// const express = require("express");
// const cors = require("cors");
// const app = express();
// const PORT = process.env.PORT || 3015;
// const bodyParaser = require("body-parser");
// const notificationRoutes = require("./routes/notificationRoutes");

// app.use(bodyParaser.json());
// app.use(cors());

// app.use("/api/notifications", notificationRoutes);

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

// const express=require('express');
// const app=express();

// app.use(express.json());
// app.use('/api',require('./routes/notificationRoutes'));

// app.listen(3015,function(){
//     console.log('ready to go')
// });

const express = require("express");
const cors = require("cors");
const { logger } = require("./utils/logger");
const app = express();

// Enable CORS for frontend (adjust origin as needed)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://nandi.webscicle.com",
      "https://nandi.webscicle.com",
      "https://adminnandi.webscicle.com",
      "https://www.adminnandi.webscicle.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "token",
      "Accept-Version",
    ],
  })
);

app.use(express.json());

// clg req route
app.use((req, res, next) => {
  logger.info(`Received request to ${req.url}`);
  next();
});

// Your routes
app.use("/api/admin/notification", require("./routes/notificationRoutes"));

app.listen(3015, function () {
  console.log("Server running on http://localhost:3015");
});
