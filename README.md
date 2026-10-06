# Study Tracker

A small daily tracker for your study plan: core knowledge, maths, practice
problems, system design and book reading. Frontend and backend live in one
repo and deploy together on Netlify.

## How it's built

```
public/                  Frontend (plain HTML, CSS, JS – no build step)
public/data/             Study library (JSON): Linux, system design, Q&A banks
app.js                   Express app: routes + middleware
index.js                 Local dev server (API + frontend on one port)
netlify/functions/api.js Wraps the Express app as a Netlify Function
api/Controller/          Reads the request, sends the response
api/Business/            The rules (scoring, validation, what can change)
api/Service/             Talks to MongoDB
Schema/dayLog.js         Mongoose schema: one document per day
middleware/              Token check + constants
utils/plan.js            YOUR PLAN – which task shows on which weekday
utils/library.js         Order in which library items are assigned to days
utils/recommendedBooks.js Starter bookshelf (10 books in 4 genres)
utils/connectionSetup.js Cached MongoDB connection
```

### API (REST style)

| Method | Path | What it does |
|---|---|---|
| POST | `/api/login` | Passcode in, JWT out (the token carries your database name) |
| GET | `/api/me` | Your name |
| GET | `/api/reviews?date=` | Items due for review on your local date |
| POST | `/api/reviews/:itemId` | Answer a review: `{ result: "easy" \| "hard", date }` |
| GET / POST | `/api/problems` | List / log solved problems |
| PATCH / DELETE | `/api/problems/:id` | Edit (e.g. revisit flag) / remove a problem |
| GET | `/api/push/key` | Public key the browser needs for notifications |
| GET / POST / DELETE | `/api/push/subscription` | Reminder status / turn on or change time / turn off |
| POST | `/api/push/test` | Send yourself a test notification |
| GET | `/api/days/:date` | One day (plan tasks if nothing saved yet) |
| PUT | `/api/days/:date` | Save that day's progress, note, outing flag |
| GET | `/api/days?from=&to=` | Daily summaries for the streak and heatmap |
| GET | `/api/progress` | Ids of every library item you've learned |
| GET | `/api/books` | Your genres and books (adds the starter shelf the first time) |
| POST | `/api/books` | Add a book |
| PATCH | `/api/books/:id` | Change a book (e.g. status: to-read → reading → done) |
| DELETE | `/api/books/:id` | Remove a book |
| POST | `/api/genres` | Add a genre |
| DELETE | `/api/genres/:id` | Remove a genre (only when it has no books) |

## Run locally

1. Add these to `.env` (see `.env.example`):
   `MONGODB_URI`, `JWT_SECRET`, `APP_PASSCODE`, and optionally `DB_NAME`
   (defaults to `StudyTracker`).
2. `npm install`
3. `npm run dev` and open http://localhost:5000

## Deploy on Netlify

1. Push this repo to GitHub.
2. Netlify → **Add new site → Import an existing project** → pick the repo.
   Leave the build command empty; `netlify.toml` already sets the publish
   folder (`public`) and functions folder.
3. **Site configuration → Environment variables**: add `MONGODB_URI`,
   `JWT_SECRET`, `APP_PASSCODE` (and `DB_NAME` if you want another name).
4. MongoDB Atlas → **Network Access**: allow `0.0.0.0/0`, because Netlify
   Functions don't have fixed IP addresses.
5. Deploy, open the site, enter your passcode.

## Study library

| Track | Items | Used by |
|---|---|---|
| Linux commands | 311 | "Linux commands" task, 5 a day |
| JavaScript, Node.js, MongoDB, SQL, Networks Q&A | 50 each | "Core knowledge", 3 a day, one topic after another |
| Bits & Bytes (24 concepts + 36 practice sums) | 60 | "Core knowledge", after the topics above are done |
| Architecture concepts Q&A | 50 | "System design" days, 2 per day |
| System design problems | 20 easy, 20 medium, 20 hard | "System design" days, 1 per day |

The app gives you the next items you haven't ticked yet, so anything you
don't finish rolls over to the next day. Tick an item once you can explain
it in your own words. The Library tab lets you browse and search everything.

## Review, problems, reminders, login limits

- **Review (spaced repetition):** every library item you tick comes back on
  the Today page after 1 day. *Easy* pushes it further (3 → 7 → 21 → 60
  days, then it's mastered); *Hard* brings it back tomorrow. Intervals live
  in `middleware/constants.js` (`REVIEW_INTERVALS`).
- **Problems log:** the Problems tab (or "+ Log a problem" on Today's
  practice task) saves each problem with its link, topic, difficulty and
  *what tricked me*. Logging one also adds 1 to that day's practice counter.
- **Evening reminder:** tap the bell. Netlify runs
  `netlify/functions/reminders.js` every 15 minutes and sends a
  notification at your chosen time, only if tasks or reviews are left.
  On iPhone it works only from the Home Screen app (iOS 16.4+).
  Needs `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`.
- **Login limits:** 5 wrong passcodes from the same network locks login
  there for 15 minutes (`LOGIN_MAX_FAILS`, `LOGIN_WINDOW_MINUTES`).

## Accounts (one database per person)

Each passcode is a separate account with its own progress, stored in its
own MongoDB database on the same cluster.

- **You:** log in with `APP_PASSCODE` from `.env`. Your account is created
  on first login with the name from `OWNER_NAME` and keeps using the
  `StudyTracker` database (or `DB_NAME` if you set one).
- **Someone else:** in MongoDB Atlas, open the `StudyTrackerAccounts`
  database → `Users` collection → **Insert document**:

  ```json
  { "name": "Rahul", "passcode": "pick-a-unique-passcode" }
  ```

  When they log in the first time, the app replaces the plain passcode
  with a hash and creates their database (e.g. `st_rahul_a1b2c3`).
- **Rename someone:** edit `name` in their document. It shows as
  "Hi, name" at the top of the app.
- **Block someone:** add `"active": false` to their document.
- Passcodes must be different for every person.
- Passcode hashes use `JWT_SECRET`. If you change `JWT_SECRET`, everyone
  has to be re-added with a plain `passcode` again (your `APP_PASSCODE`
  keeps working).

## Changing your plan

Edit `utils/plan.js`. Days are numbers: 0 = Sunday … 6 = Saturday.
Days you've already saved keep their tasks; new days use the new plan.
