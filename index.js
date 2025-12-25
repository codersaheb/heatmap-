import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import fs from "fs";

const git = simpleGit();
const path = "./data.json";

// CONFIG
const START_DATE = moment("2025-12-13");
const END_DATE = moment("2025-12-25");
const TOTAL_COMMITS = 24;
const UNIQUE_DAYS = 7;

// Human-like commit messages
const messages = [
  "update logic",
  "minor fix",
  "refactor",
  "cleanup",
  "adjust config",
  "improve readability",
  "fix edge case",
  "small tweak",
  "update data",
  "optimize flow",
];

// Working hour bias (humans don’t code at 4am often)
const WORK_HOURS = [9, 10, 11, 12, 14, 15, 16, 17, 18, 21];

// 1️⃣ Pick unique days
const daysSet = new Set();
while (daysSet.size < UNIQUE_DAYS) {
  const randomDay = START_DATE.clone().add(
    Math.floor(Math.random() * END_DATE.diff(START_DATE, "days")),
    "days"
  );
  daysSet.add(randomDay.format("YYYY-MM-DD"));
}

const days = Array.from(daysSet);

// 2️⃣ Distribute commits (uneven, human-like)
let commitsLeft = TOTAL_COMMITS;
const commitPlan = days.map((day, i) => {
  const remaining = days.length - i;
  const maxToday = Math.ceil((commitsLeft / remaining) * 1.5);
  const commitsToday =
    i === days.length - 1
      ? commitsLeft
      : Math.max(1, Math.floor(Math.random() * maxToday));

  commitsLeft -= commitsToday;
  return { day, commits: commitsToday };
});

// Helper: random array value
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 3️⃣ Create commits
(async () => {
  let state = jsonfile.readFileSync(path, { throws: false }) || { version: 0 };

  for (const { day, commits } of commitPlan) {
    for (let i = 0; i < commits; i++) {
      const time = moment(day)
        .hour(pick(WORK_HOURS))
        .minute(Math.floor(Math.random() * 60))
        .second(Math.floor(Math.random() * 60))
        .format();

      // subtle, realistic change
      state.version += 1;
      state.lastUpdated = moment(time).format("YYYY-MM-DD");
      state.flags = state.flags || [];
      if (Math.random() > 0.7) state.flags.push(`f${state.version}`);

      jsonfile.writeFileSync(path, state, { spaces: 2 });

      await git.add([path]);
      await git.commit(pick(messages), {
        "--date": time,
      });
    }
  }

  await git.push();
  console.log("Done.");
})();
