require('dotenv').config();
const express = require('express');
const app = express();

const { getController } = require('./controllers/sql/get');
const { postController } = require('./controllers/sql/post');
const { createTableController, updateTableController } = require('./controllers/table');
const { verifyTokenWithRules } = require('./middlewares/verifyTokenWithRules');
const { getEndpoint } = require('./middlewares/getEndpoint');
// const { mongodbGetController } = require('./controllers/mongodb/get');
const cors = require('cors');
const { patchController } = require('./controllers/sql/patch');
const { deleteController } = require('./controllers/sql/delete');
const { notificationController } = require('./controllers/sql/notification');

app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
    res.status(200).json({ message: "OK" });
});

app.post('/send-notification/:endpoint', getEndpoint, notificationController);
app.post('/create-table', createTableController);
app.post('/update-table', updateTableController);

app.get('/:endpoint', getEndpoint, verifyTokenWithRules, getController);
// app.get('/:endpoint', getEndpoint, verifyTokenWithRules, mongodbGetController);
app.post('/:endpoint', getEndpoint, verifyTokenWithRules, postController);
app.patch('/:endpoint', getEndpoint, verifyTokenWithRules, patchController);
app.delete('/:endpoint', getEndpoint, verifyTokenWithRules, deleteController);

app.listen(5500, () => {
    console.log("listening on port 5500");
});
