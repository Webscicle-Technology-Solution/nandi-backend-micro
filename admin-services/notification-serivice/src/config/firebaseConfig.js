// // config/firebaseConfig.js
// const admin = require('firebase-admin');
// const serviceAccount = require('../credentials/fir-90eae-firebase-adminsdk-qraow-fee38af8a8.json');  // Your Firebase service account key

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;




// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("../credentials/nandipictures-34c07-firebase-adminsdk-fbsvc-797cfc3a56.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;