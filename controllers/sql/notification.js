const { createConnection, closeConnection } = require("../../utils/db.helpers");
const { sendPushNotification } = require("../../utils/push-notification");
// [
//     {
//         "fcm_token": "<Device FCM token>",
//         "notification": {
//           "title": "Check this Mobile (title)",
//           "body": "Rich Notification testing (body)",
//           "mutable_content": true,
//           "sound": "Tri-tone"
//         },
//         "data": {
//            "url": "<url of media image>",
//            "dl": "<deeplink action on tap of notification>"
//         }
//     },
// ]

async function notificationController(req, res) {
    try {
        const endpoint = req.endpoint;
        const serverKey = endpoint.server_key;
        const notificationsData = req.body.notificationsData;
        const private_cert = endpoint.private_cert;

        // Convert the JSON object to a JSON string
        const jsonString = JSON.stringify(private_cert, null, 2);

        // Create a Blob from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create an object URL for the Blob
        const private_cert_url = URL.createObjectURL(blob);

        // console.log(endpoint.private_cert, " <<<<<<<<<<<<<<<<<<<<<<<<<<");
        try {
            let connection;

            if (endpoint.dbConnectionString) {
                connection = await createConnection(endpoint.dbConnectionString);
            }

            const requests = notificationsData.map(async (notificationObject) => {
                let fcm_token = notificationObject.fcm_token;

                if (!fcm_token) {
                    if (endpoint.tableName && endpoint.fcm_col_name) {
                        try {
                            const whereClause = endpoint.where;
                            const whereConditions = Object.keys(whereClause)
                                .map((key) => `${key} = ?`)
                                .join(" AND ");
                            const whereValues = getWhereValues(
                                whereClause,
                                req,
                                notificationObject,
                            );

                            const query = `SELECT ?? FROM ?? WHERE ${whereConditions}`;
                            const values = [
                                endpoint.fcm_col_name,
                                endpoint.tableName,
                                ...whereValues,
                            ];

                            const { promisify } = require("util");
                            const queryAsync = promisify(connection.query).bind(connection);

                            const results = await queryAsync(query, values);

                            if (results.length > 0) {
                                fcm_token = results[0][endpoint.fcm_col_name];
                            } else {
                                throw new Error("No matching record found in the database.");
                            }
                        } catch (error) {
                            console.error("Database error:", error.message);
                            throw new Error(
                                "Error retrieving `fcm_token` from the database.",
                            );
                        }
                    } else {
                        throw new Error("`fcm_token` is required.");
                    }
                }

                const notification = notificationObject.notification;
                const data = notificationObject?.data;

                try {
                    //   console.log(
                    //     "TCL: notificationController -> notification.title, notification.data, fcm_token, private_cert,",
                    //     notification.title,
                    //     notification.data,
                    //     fcm_token,
                    //     private_cert,
                    //   );
                    await sendPushNotification(
                        notification,
                        data,
                        fcm_token,
                        private_cert_url,
                    );
                    return {
                        success: true,
                        message: "Notification sent",
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: "Notification failed to send",
                        response: error,
                    };
                }

                // }
            });

            // Use Promise.all to execute all requests concurrently
            const results = await Promise.all(requests);

            // Check results for any errors
            const hasError = results.some((result) => !result.success);

            if (connection) closeConnection(connection);

            if (hasError) {
                return res.status(500).json({
                    message: "Some notifications failed to send.",
                    results: results,
                });
            } else {
                return res
                    .status(200)
                    .json({ message: "All notifications sent successfully.", results });
            }
        } catch (error) {
            console.error("Error:", error.message);
            return res.status(500).json({ message: `Error: ${error.message}` });
        }
    } catch (error) {
        console.error("Error occurred:", error);
        if (error.sql) delete error.sql;
        res.status(500).json({ message: "Internal server error", log: error });
    }
}

const getWhereValues = (whereClause, req, notificationObject) => {
    return Object.values(whereClause).map((key) => {
        if (key.startsWith("req.")) {
            const reqKey = key.replace("req.", "");
            const nestedKeys = reqKey.split(".");
            let nestedValue = req;

            for (const nestedKey of nestedKeys) {
                if (nestedValue.hasOwnProperty(nestedKey)) {
                    nestedValue = nestedValue[nestedKey];
                } else {
                    // Handle the case where a nested property is not found
                    nestedValue = undefined;
                    break;
                }
            }

            return nestedValue;
        } else if (key.includes("notificationObject.")) {
            const reqKey = key.replace("notificationObject.", "");
            const nestedKeys = reqKey.split(".");
            let nestedValue = notificationObject;

            for (const nestedKey of nestedKeys) {
                if (nestedValue.hasOwnProperty(nestedKey)) {
                    nestedValue = nestedValue[nestedKey];
                } else {
                    nestedValue = undefined;
                    break;
                }
            }

            return nestedValue;
        } else {
            return key;
        }
    });
};

module.exports = {
    notificationController,
};
