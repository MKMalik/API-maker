const admin = require("firebase-admin");
const fcm = require("fcm-notification");

const certpath = admin.credential.cert(require('../private-cert.json'));
const FCM = new fcm(certpath);

const sendPushNotification = (title, body, data, fcm_token, private_cert) => {
  // const certpath = admin.credential.cert(private_cert);
  console.log(title, body, data, fcm_token);
  try {
    let message = {
      notification: {
        title,
        body,
      },
      data: data,
      token: fcm_token,
    };


    FCM.send(message, (err) => {
      if (err) {
        console.error("Error while sending notification", err);
        throw err;
      }
    });
  } catch (error) {
    console.error("Error while sending notification", error);
  }
};

module.exports = {
  sendPushNotification,
};
