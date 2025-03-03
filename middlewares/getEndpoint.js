// const { endpoints } = require("../endpoints");
const path = require('path');
const url = require('url');

// Path to your endpoints JavaScript file
const endpointsFilePath = path.resolve(path.dirname(process.execPath), './endpoints.js');

// Load endpoint configurations from external JavaScript file
let endpoints = {};

try {
  if (process.env.NODE_ENV === 'development') {
    endpoints = require('../endpoints');
  } else
    endpoints = require(endpointsFilePath);
} catch (err) {
  console.error('Error loading endpoints file:', err);
  process.exit(1);
}
const getEndpoint = (req, res, next) => {
  const parsedUrl = url.parse(req.url, true);

  // console.log(parsedUrl, req);
  let pathname = parsedUrl.pathname;
  if (pathname.startsWith('/send-notification')) {
    pathname = pathname.replace('/send-notification', '');
    req.method = 'NOTIFICATION';
  }
  const endpoint = endpoints[req.method.toUpperCase()][pathname];
  if (pathname.startsWith('/login')) {
    req.method = 'LOGIN';
  }

  // console.log("Endpoint: ", endpoint);
  if (!endpoint) {
    console.log(endpoint);
    return res.status(404).json({ message: "Endpoint not found" });
  }

  req.endpoint = endpoint;
  next();
};

module.exports = { getEndpoint };
