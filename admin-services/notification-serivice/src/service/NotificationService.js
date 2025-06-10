const admin = require("../config/firebaseConfig");

class NotificationService {
    static async sendPushNotification(deviceToken, title, body) {
        const message = {
            notification: {
                title,
                body
            },
            token: deviceToken
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('Push notification sent successfully:', response);
            return response;
        } catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    }

//     static async sendMultipleNotification(deviceToken, title, body) {
//         const message = deviceToken.map(token =>({
//             notification: {
//                 title,
//                 body
//             },
//             token: token
//         }))

//         try {
//             const response = await admin.messaging().sendEach(message);
//             console.log('Push notification sent successfully:', response);
//             return response;
//         } catch (error) {
//             console.error('Error sending push notification:', error);
//             throw error;
//         }
//     }

   
// };

        // Send to multiple devices
        static async sendMultipleNotification(deviceTokens, title, body) {
            const message = {
                notification: {
                    title,
                    body
                },
                tokens: deviceTokens
            };

            try {
                const response = await admin.messaging().sendMulticast(message);
                console.log('✅ Multicast push notification sent:', response);
                return response;
            } catch (error) {
                console.error('❌ Error sending multicast push notification:', error);
                throw error;
            }
        }
}

module.exports = NotificationService;