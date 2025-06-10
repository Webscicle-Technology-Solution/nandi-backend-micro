// // const mongoose = require('mongoose');

// // const UserSchema = new mongoose.Schema({
// //   name: String,
// //   email: String,
// //   fcmToken: String, // used for push notifications
// // });

// // module.exports = mongoose.model('User', UserSchema);


// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },

//   password: {
//     type: String,
//     required: true,
//   },

//   deviceToken: {
//     type: String,
//     default: null,
//   },

//   isSubscribed: {
//     type: Boolean,
//     default: false,
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },

//   // You can add other OTT-specific fields like:
//   watchHistory: [{
//     videoId: mongoose.Schema.Types.ObjectId,
//     watchedAt: Date,
//   }],

//   favorites: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Video',
//   }]
// });

// module.exports = mongoose.model('User', userSchema);