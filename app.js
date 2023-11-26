require('dotenv').config();
const express = require('express');
const app = express();

const { getController } = require('./controllers/get');
const { postController } = require('./controllers/post');

app.use(express.json())
app.get('/', (req, res) => {
    res.status(200).json({ message: "OK" });
});

app.get('/:endpoint', getController);
app.post('/:endpoint', postController);

app.listen(5500, () => {
    console.log("listening on port...");
});
