const express = require("express");
const cors = require("cors");

const app = express();

/* ================= CONFIG ================= */

// Render / hosting will inject PORT
const PORT = process.env.PORT || 3001;

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

/* ================= PROJECT DATA ================= */

const projects = [
  {
    id: 1,
    title: "Personal Portfolio",
    description: "Personal website built using React + Vite with a Node backend.",
    tech: ["React", "Vite", "Node.js", "Express"],
  },
  {
    id: 2,
    title: "DSA Practice",
    description: "Solved DSA problems across LeetCode and Codeforces.",
    tech: ["C++", "STL", "Algorithms"],
  },
  {
    id: 3,
    title: "Mini Projects",
    description: "Small frontend and backend experiments for learning.",
    tech: ["JavaScript", "CSS", "APIs"],
  },
];

/* ================= ROUTES ================= */

// GET PROJECTS
app.get("/api/projects", (req, res) => {
  res.json(projects);
});

// CONTACT FORM
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body || {};

  console.log("📩 New Message:");
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Message:", message);
  console.log("--------------------------");

  res.json({
    success: true,
    message: "Message received successfully",
  });
});

/* ================= COMPETITIVE STATS ================= */

const LEETCODE_USERNAME = "tejasRkirigeri08";
const CODEFORCES_HANDLE = "tejasrk1642006";

async function fetchLeetCodeStats() {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({
      query,
      variables: { username: LEETCODE_USERNAME },
    }),
  });

  const json = await res.json();

  const stats = json?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];

  const parsed = {
    username: LEETCODE_USERNAME,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
  };

  stats.forEach((s) => {
    if (s.difficulty === "All") parsed.totalSolved = s.count;
    if (s.difficulty === "Easy") parsed.easySolved = s.count;
    if (s.difficulty === "Medium") parsed.mediumSolved = s.count;
    if (s.difficulty === "Hard") parsed.hardSolved = s.count;
  });

  return parsed;
}

async function fetchCodeforcesStats() {
  const userRes = await fetch(
    `https://codeforces.com/api/user.info?handles=${CODEFORCES_HANDLE}`
  );
  const userData = await userRes.json();

  const user = userData.result[0];

  const submissionsRes = await fetch(
    `https://codeforces.com/api/user.status?handle=${CODEFORCES_HANDLE}`
  );

  const submissionsData = await submissionsRes.json();
  const subs = submissionsData.result || [];

  const solvedSet = new Set();
  subs.forEach((s) => {
    if (s.verdict === "OK") {
      solvedSet.add(`${s.problem.contestId}-${s.problem.index}`);
    }
  });

  // streak calculation
  const solvedDays = new Set();
  subs.forEach((s) => {
    if (s.verdict === "OK") {
      const date = new Date(s.creationTimeSeconds * 1000).toDateString();
      solvedDays.add(date);
    }
  });

  let streak = 0;
  let today = new Date();
  while (true) {
    if (solvedDays.has(today.toDateString())) {
      streak++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    handle: CODEFORCES_HANDLE,
    rating: user.rating,
    maxRating: user.maxRating,
    rank: user.rank,
    totalSolved: solvedSet.size,
    currentStreak: streak,
  };
}

app.get("/api/competitive-stats", async (req, res) => {
  try {
    const [leetcode, codeforces] = await Promise.all([
      fetchLeetCodeStats(),
      fetchCodeforcesStats(),
    ]);

    res.json({
      leetcode,
      codeforces,
    });
  } catch (err) {
    console.error("Stats fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch competitive stats" });
  }
});

/* ================= START ================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});