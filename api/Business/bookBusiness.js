const { isValidObjectId } = require("mongoose");
const svc = require("../Service/bookService");
const RECOMMENDED = require("../../utils/recommendedBooks");

const httpError = (status, message) => Object.assign(new Error(message), { status });
const STATUSES = ["to-read", "reading", "done"];

const cleanText = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const assertId = (id) => {
  if (!isValidObjectId(id)) throw httpError(400, "Invalid id");
};

// First visit with an empty shelf: add the recommended books
const seedIfEmpty = async (dbName) => {
  if ((await svc.countGenresService(dbName)) > 0 || (await svc.countBooksService(dbName)) > 0) return;
  for (const group of RECOMMENDED) {
    const genre = await svc.createGenreService(dbName, { name: group.genre, nameKey: group.genre.toLowerCase() });
    await svc.createBooksService(dbName, group.books.map((b) => ({ ...b, genreId: genre._id })));
  }
};

const listBooksBusiness = async (dbName) => {
  await seedIfEmpty(dbName);
  const [genres, books] = await Promise.all([svc.findGenresService(dbName), svc.findBooksService(dbName)]);
  return { genres, books };
};

const createGenreBusiness = async (dbName, { name } = {}) => {
  const clean = cleanText(name, 40);
  if (!clean) throw httpError(400, "Genre name is required");
  const nameKey = clean.toLowerCase();
  if (await svc.findGenreService(dbName, { nameKey })) throw httpError(409, "That genre already exists");
  return svc.createGenreService(dbName, { name: clean, nameKey });
};

const deleteGenreBusiness = async (dbName, id) => {
  assertId(id);
  if ((await svc.countBooksService(dbName, { genreId: id })) > 0) {
    throw httpError(400, "Move or delete the books in this genre first");
  }
  const deleted = await svc.deleteGenreService(dbName, id);
  if (!deleted) throw httpError(404, "Genre not found");
  return deleted;
};

const createBookBusiness = async (dbName, { title, author, why, genreId } = {}) => {
  const cleanTitle = cleanText(title, 120);
  if (!cleanTitle) throw httpError(400, "Book title is required");
  assertId(genreId);
  if (!(await svc.findGenreService(dbName, { _id: genreId }))) throw httpError(400, "Pick a genre that exists");
  return svc.createBookService(dbName, {
    title: cleanTitle,
    author: cleanText(author, 80),
    why: cleanText(why, 200),
    genreId,
  });
};

// PATCH: only the fields you send are changed
const updateBookBusiness = async (dbName, id, payload = {}) => {
  assertId(id);
  const update = {};
  if (payload.status !== undefined) {
    if (!STATUSES.includes(payload.status)) throw httpError(400, "Status must be to-read, reading or done");
    update.status = payload.status;
  }
  if (payload.title !== undefined) {
    update.title = cleanText(payload.title, 120);
    if (!update.title) throw httpError(400, "Book title can't be empty");
  }
  if (payload.author !== undefined) update.author = cleanText(payload.author, 80);
  if (payload.why !== undefined) update.why = cleanText(payload.why, 200);
  if (payload.genreId !== undefined) {
    assertId(payload.genreId);
    if (!(await svc.findGenreService(dbName, { _id: payload.genreId }))) throw httpError(400, "Pick a genre that exists");
    update.genreId = payload.genreId;
  }
  const book = await svc.updateBookService(dbName, id, update);
  if (!book) throw httpError(404, "Book not found");
  return book;
};

const deleteBookBusiness = async (dbName, id) => {
  assertId(id);
  const deleted = await svc.deleteBookService(dbName, id);
  if (!deleted) throw httpError(404, "Book not found");
  return deleted;
};

module.exports = {
  listBooksBusiness,
  createGenreBusiness,
  deleteGenreBusiness,
  createBookBusiness,
  updateBookBusiness,
  deleteBookBusiness,
};
