require('dotenv').config();
const express = require('express');
const app = express();

const { getController } = require('./controllers/get');
const { postController } = require('./controllers/post');
const { createTableController } = require('./controllers/table');
const { verifyTokenWithRules } = require('./middlewares/verifyTokenWithRules');
const { getEndpoint } = require('./middlewares/getEndpoint');

app.use(express.json())
app.get('/', (req, res) => {
    res.status(200).json({ message: "OK" });
});

app.post('/create-table', createTableController);

app.get('/:endpoint', getEndpoint, verifyTokenWithRules, getController);
app.post('/:endpoint', getEndpoint, verifyTokenWithRules, postController);

app.listen(5500, () => {
    console.log("listening on port...");
});
