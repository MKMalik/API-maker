const { endpoints } = require("../endpoints");
const url = require('url');

const getEndpoint = (req, res, next) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const endpoint = endpoints[req.method.toUpperCase()][pathname];
    if (!endpoint) {
        return res.status(404).json({ message: "Endpoint not found" });
    }

    req.endpoint = endpoint;
    next();
};

module.exports = { getEndpoint };