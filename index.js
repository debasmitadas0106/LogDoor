const express = require("express");
const app = express();
const dotenv = require("dotenv");
const axios = require("axios");
const {
  createUserController,
  findUserController,
  findAllUserController,
} = require("./api/Controller/userController");
const { findUserBusiness } = require("./api/Business/userBusiness");
const {
  verifyEmailController,
} = require("./api/Controller/verifyEmailController");
const port = process.env.PORT || 5000;

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hi the app is working");
});

app.get("/api-check", (req, res) => {
  console.log("Jay shree ram");
  res.send("LogDoor has started well");
});

app.post("/create-user", createUserController);
app.get("/find-user", findUserController);
app.get("/find-all-user", findAllUserController);

app.post("/verify-user", verifyEmailController);

app.listen(port, () => {
  console.log(`app is listening at port ${port}`);
});
