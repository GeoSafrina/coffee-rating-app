const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SEED_FILE = path.join(__dirname, "data", "seed.json");
const DB_FILE = path.join(__dirname, "data", "db.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- JSON-file database (created from seed data on first run) ----
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.copyFileSync(SEED_FILE, DB_FILE);
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function saveDb(items) {
  fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2));
}

// GET /coffees - all items, optional ?search=
app.get("/coffees", (req, res) => {
  const q = (req.query.search || "").toString().toLowerCase().trim();
  let items = loadDb();
  if (q) {
    items = items.filter((c) =>
      Object.values(c).some((v) => String(v).toLowerCase().includes(q))
    );
  }
  res.json(items);
});

// POST /coffees/:id/vote - increment vote counter
app.post("/coffees/:id/vote", (req, res) => {
  const items = loadDb();
  const coffee = items.find((c) => String(c.id) === req.params.id);
  if (!coffee) return res.status(404).json({ error: "Coffee not found." });

  coffee.votes = (coffee.votes || 0) + 1;
  saveDb(items);
  res.json(coffee);
});

// GET /leaderboard - top rated, highest votes first
app.get("/leaderboard", (req, res) => {
  const top = loadDb()
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);
  res.json(top);
});

app.listen(PORT, () => {
  console.log(`Coffee Rating app running on port ${PORT}`);
});
