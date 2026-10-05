const express = require("express");
const { verifyToken } = require("./middleware/verifyToken");
const { loginController, meController } = require("./api/Controller/authController");
const {
  getDayController,
  updateDayController,
  listDaysController,
  getProgressController,
} = require("./api/Controller/dayController");
const books = require("./api/Controller/bookController");

const app = express();
app.use(express.json());

const router = express.Router();

// Public routes
router.get("/health", (req, res) => res.json({ success: true, message: "Study tracker is running" }));
router.post("/login", loginController);

// Everything below needs a token
router.use(verifyToken);
router.get("/me", meController);
router.get("/days", listDaysController);
router.get("/days/:date", getDayController);
router.put("/days/:date", updateDayController);
router.get("/progress", getProgressController);

router.get("/books", books.listBooksController);
router.post("/books", books.createBookController);
router.patch("/books/:id", books.updateBookController);
router.delete("/books/:id", books.deleteBookController);
router.post("/genres", books.createGenreController);
router.delete("/genres/:id", books.deleteGenreController);

// Locally the API lives at /api. On Netlify, netlify.toml redirects /api/*
// to the function, which may see either path, so we mount both.
app.use(["/api", "/.netlify/functions/api"], router);

module.exports = app;
