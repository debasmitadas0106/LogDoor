// Local development: serves the frontend and the API on one port.
// On Netlify, the frontend is served from /public and the API runs
// as a function (netlify/functions/api.js) instead.
require("dotenv").config();
const path = require("path");
const express = require("express");
const app = require("./app");

const port = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log(`Study tracker running at http://localhost:${port}`);
});
