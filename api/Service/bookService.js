const bookSchema = require("../../Schema/book");
const genreSchema = require("../../Schema/genre");
const dbConnect = require("../../utils/connectionSetup");

// Every function takes the account's dbName first
const models = async (dbName) => {
  const conn = await dbConnect(dbName);
  return {
    Books: conn.models.Books || conn.model("Books", bookSchema, "Books"),
    Genres: conn.models.Genres || conn.model("Genres", genreSchema, "Genres"),
  };
};

// ----- Genres -----
const findGenresService = async (dbName) => (await models(dbName)).Genres.find().sort({ createdAt: 1 }).lean();
const findGenreService = async (dbName, condition) => (await models(dbName)).Genres.findOne(condition).lean();
const createGenreService = async (dbName, data) => (await (await models(dbName)).Genres.create(data)).toObject();
const deleteGenreService = async (dbName, id) => (await models(dbName)).Genres.findByIdAndDelete(id).lean();
const countGenresService = async (dbName) => (await models(dbName)).Genres.countDocuments();

// ----- Books -----
const findBooksService = async (dbName, condition = {}) => (await models(dbName)).Books.find(condition).sort({ createdAt: 1 }).lean();
const countBooksService = async (dbName, condition = {}) => (await models(dbName)).Books.countDocuments(condition);
const createBooksService = async (dbName, docs) => (await models(dbName)).Books.insertMany(docs);
const createBookService = async (dbName, data) => (await (await models(dbName)).Books.create(data)).toObject();
const updateBookService = async (dbName, id, data) =>
  (await models(dbName)).Books.findByIdAndUpdate(id, { $set: data }, { returnDocument: "after", runValidators: true }).lean();
const deleteBookService = async (dbName, id) => (await models(dbName)).Books.findByIdAndDelete(id).lean();

module.exports = {
  findGenresService,
  findGenreService,
  createGenreService,
  deleteGenreService,
  countGenresService,
  findBooksService,
  countBooksService,
  createBooksService,
  createBookService,
  updateBookService,
  deleteBookService,
};
