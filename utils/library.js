// The study content lives in public/data so the browser can load it too.
// The server only needs the ids, in order, to decide what to study next.
const TRACKS = {
  linux: require("../public/data/linux.json"),
  sd: require("../public/data/systemDesign.json"),
  js: require("../public/data/qa-js.json"),
  node: require("../public/data/qa-node.json"),
  mongo: require("../public/data/qa-mongo.json"),
  sql: require("../public/data/qa-sql.json"),
  arch: require("../public/data/qa-architecture.json"),
  net: require("../public/data/qa-network.json"),
  bits: require("../public/data/qa-bits.json"),
};

const ids = (track) => TRACKS[track].map((item) => item.id);

// Take one from each list in turn: js-01, node-01, mongo-01, sql-01, js-02...
const roundRobin = (...lists) => {
  const out = [];
  const longest = Math.max(...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) lists.forEach((l) => l[i] && out.push(l[i]));
  return out;
};

// A queue is the order in which items get assigned to your days
const QUEUES = {
  linux: ids("linux"),
  sd: ids("sd"),
  arch: ids("arch"),
  // Bits & Bytes comes after the other topics: it's the "later stage" part
  core: [...roundRobin(ids("js"), ids("node"), ids("mongo"), ids("sql"), ids("net")), ...ids("bits")],
};

const ALL_IDS = new Set(Object.values(TRACKS).flat().map((item) => item.id));

// Next `count` items from a queue that you haven't learned yet
const nextItems = (queue, count, learned) =>
  QUEUES[queue].filter((id) => !learned.has(id)).slice(0, count);

module.exports = { QUEUES, ALL_IDS, nextItems };
