const express = require("express");
const cors = require("cors");

const app = express();

/* ================= CONFIG ================= */

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
    title: "Visitor Management System (Mobile App)",
    stack: "Flutter · Firebase · Cross-Platform",
    description:
      "A real-time visitor management mobile application that streamlines visitor onboarding, tracking, and access control using role-based workflows.",
    highlights: [
      "Multi-role access: Admin, Receptionist, Host, Guard",
      "QR code based visitor check-in / check-out",
      "Real-time updates using Firebase Firestore",
      "Offline-first support with auto sync",
    ],
    tags: ["Flutter", "Firebase", "Mobile App"],
    link: "https://github.com/TejasRK007/vms",
  },
  {
    id: 2,
    title: "Stock Price Prediction Engine",
    stack: "Python · Machine Learning · Data Analysis",
    description:
      "A machine learning-based stock prediction system built using historical market data to experiment with trend forecasting and predictive modeling.",
    highlights: [
      "Data preprocessing and feature extraction",
      "Model experimentation for stock trend prediction",
      "Modular ML pipeline for future improvements",
    ],
    tags: ["Python", "Machine Learning", "Time Series"],
    link: "https://github.com/TejasRK007/stock_predictor",
  },
  {
    id: 3,
    title: "Flutter Starter Application",
    stack: "Flutter · Dart · Cross-Platform",
    description:
      "A starter Flutter project scaffold designed for rapid prototyping and learning cross-platform mobile application development.",
    highlights: [
      "Clean Flutter project structure",
      "Cross-platform support (Android / iOS / Web)",
      "Foundation for future mobile apps",
    ],
    tags: ["Flutter", "Dart", "Mobile UI"],
    link: "https://github.com/TejasRK007/one2",
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

const LEETCODE_USERNAME = "Tejas_RK08";
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
  const stats =
    json?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];

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
    } else break;
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

    res.json({ leetcode, codeforces });
  } catch (err) {
    console.error("Stats fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch competitive stats" });
  }
});

/* ================= START ================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});