const { createConnection, closeConnection } = require("../../utils/db.helpers");
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

        try {
            let connection;

            if (endpoint.dbConnectionString) {
                connection = await createConnection(endpoint.dbConnectionString);
            }

            const requests = notificationsData.map(async (notificationObject, notificationObjectIndex) => {
                let fcm_token = notificationObject.fcm_token;

                if (!fcm_token) {
                    if (endpoint.tableName && endpoint.fcm_col_name) {
                        try {
                            const whereClause = endpoint.where;
                            const whereConditions = Object.keys(whereClause).map(key => `${key} = ?`).join(' AND ');
                            const whereValues = getWhereValues(whereClause, req, notificationObject);

                            const query = `SELECT ?? FROM ?? WHERE ${whereConditions}`;
                            const values = [endpoint.fcm_col_name, endpoint.tableName, ...whereValues];

                            const { promisify } = require('util');
                            const queryAsync = promisify(connection.query).bind(connection);


                            const results = await queryAsync(query, values);

                            if (results.length > 0) {
                                fcm_token = results[0][endpoint.fcm_col_name];
                            } else {
                                throw new Error('No matching record found in the database.');
                            }

                        } catch (error) {
                            console.error('Database error:', error.message);
                            throw new Error('Error retrieving `fcm_token` from the database.');
                        }
                    } else {
                        throw new Error('`fcm_token` is required.');
                    }
                }

                const notification = notificationObject.notification;
                const data = notificationObject.data;

                const response = await fetch('https://fcm.googleapis.com/fcm/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `key=${serverKey}`,
                    },
                    body: JSON.stringify({
                        to: fcm_token,
                        notification: notification,
                        data: data,
                    }),
                });

                let jsonResponse = {};
                try {
                    jsonResponse = await response.json();
                } catch (error) {

                }
                if (!response.ok || (!jsonResponse?.success || jsonResponse?.failure)) {
                    // throw new Error(`${response.status} - ${response.statusText}`);
                    if (jsonResponse.failure) {
                        return ({ success: false, message: jsonResponse?.results[0]?.error ?? 'Failed to sent notification.', firebaseError: jsonResponse });
                    }
                    return ({ success: false, message: `${response.status} - ${response.statusText}` });
                }

                // If you need to handle the response, you can parse it here
                // const jsonResponse = await response.json();
                return ({ success: true, message: 'Notification sent.', response: jsonResponse });
                // }
            });

            // Use Promise.all to execute all requests concurrently
            const results = await Promise.all(requests);

            // Check results for any errors
            const hasError = results.some(result => !result.success);

            if (connection) closeConnection(connection);

            if (hasError) {
                return res.status(500).json({ message: 'Some notifications failed to send.', results: results });
            } else {
                return res.status(200).json({ message: 'All notifications sent successfully.', results });
            }
        } catch (error) {
            console.error('Error:', error.message);
            return res.status(500).json({ message: `Error: ${error.message}` });
        }
    } catch (error) {
        console.error('Error occurred:', error);
        if (error.sql) delete error.sql;
        res.status(500).json({ message: 'Internal server error', log: error });
    }
}


const getWhereValues = (whereClause, req, notificationObject) => {
    return Object.values(whereClause).map(key => {
        if (key.startsWith('req.')) {
            const reqKey = key.replace('req.', '');
            const nestedKeys = reqKey.split('.');
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
        } else if (key.includes('notificationObject.')) {
            const reqKey = key.replace('notificationObject.', '');
            const nestedKeys = reqKey.split('.');
            let nestedValue = notificationObject;

            for (const nestedKey of nestedKeys) {
                if (nestedValue.hasOwnProperty(nestedKey)) {
                    nestedValue = nestedValue[nestedKey];
                }
                else {
                    nestedValue = undefined;
                    break;
                }
            }

            return nestedValue;
        }
        else {
            return key;
        }
    });
}

module.exports = {
    notificationController
}