const { isValidObjectId } = require("mongoose");
const svc = require("../Service/problemService");
const { httpError, isDateKey } = require("../../utils/dates");

const DIFFICULTIES = ["easy", "medium", "hard"];
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Only allow real web links, so nothing like "javascript:..." can be saved
const cleanLink = (v) => {
  const link = text(v, 500);
  if (!link) return "";
  if (!/^https?:\/\//i.test(link)) throw httpError(400, "Link must start with http:// or https://");
  return link;
};

// Shared by create and update; `partial` means only check fields that were sent
const clean = (payload = {}, partial = false) => {
  const out = {};
  const has = (k) => !partial || payload[k] !== undefined;
  if (has("title")) {
    out.title = text(payload.title, 150);
    if (!out.title) throw httpError(400, "Problem title is required");
  }
  if (has("link")) out.link = cleanLink(payload.link);
  if (has("topic")) out.topic = text(payload.topic, 40);
  if (has("tricked")) out.tricked = text(payload.tricked, 1000);
  if (has("difficulty")) {
    out.difficulty = payload.difficulty ?? "medium";
    if (!DIFFICULTIES.includes(out.difficulty)) throw httpError(400, "Difficulty must be easy, medium or hard");
  }
  if (has("date")) {
    if (!isDateKey(payload.date)) throw httpError(400, "Date must look like YYYY-MM-DD");
    out.date = payload.date;
  }
  if (payload.revisit !== undefined) out.revisit = !!payload.revisit;
  return out;
};

const assertId = (id) => {
  if (!isValidObjectId(id)) throw httpError(400, "Invalid id");
};

const listProblemsBusiness = (dbName) => svc.findProblemsService(dbName);
const createProblemBusiness = (dbName, payload) => svc.createProblemService(dbName, clean(payload));

const updateProblemBusiness = async (dbName, id, payload) => {
  assertId(id);
  const updated = await svc.updateProblemService(dbName, id, clean(payload, true));
  if (!updated) throw httpError(404, "Problem not found");
  return updated;
};

const deleteProblemBusiness = async (dbName, id) => {
  assertId(id);
  const deleted = await svc.deleteProblemService(dbName, id);
  if (!deleted) throw httpError(404, "Problem not found");
  return deleted;
};

module.exports = { listProblemsBusiness, createProblemBusiness, updateProblemBusiness, deleteProblemBusiness };
