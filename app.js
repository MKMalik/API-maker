require('dotenv').config();
const express = require('express');
const app = express();

const { getController } = require('./controllers/get');
const { postController } = require('./controllers/post');
const { createTableController } = require('./controllers/table');

app.use(express.json())
app.get('/', (req, res) => {
    res.status(200).json({ message: "OK" });
});

app.post('/create-table', createTableController);

app.get('/:endpoint', getController);
app.post('/:endpoint', postController);

app.listen(5500, () => {
    console.log("listening on port...");
});
