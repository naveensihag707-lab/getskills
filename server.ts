import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Database (In-memory)
  let users = [
    {
      id: "1",
      name: "Alex Chen",
      email: "alex@example.com",
      location: { city: "San Francisco", state: "CA", country: "USA" },
      skillsOffered: ["React", "TypeScript", "UI Design"],
      skillsWanted: ["Python", "Machine Learning"],
      level: "Intermediate",
      bio: "Computer Science student passionate about frontend development.",
      rating: 4.8,
      reviewCount: 12,
      avatar: "https://picsum.photos/seed/alex/200",
      isVerified: true,
      blockedUsers: []
    },
    {
      id: "2",
      name: "Sarah Miller",
      email: "sarah@example.com",
      location: { city: "New York", state: "NY", country: "USA" },
      skillsOffered: ["Python", "Data Analysis"],
      skillsWanted: ["React", "Graphic Design"],
      level: "Advanced",
      bio: "Data Science major looking to improve my web dev skills.",
      rating: 4.9,
      reviewCount: 8,
      avatar: "https://picsum.photos/seed/sarah/200",
      isVerified: true,
      blockedUsers: []
    },
    {
      id: "3",
      name: "Jordan Lee",
      email: "jordan@example.com",
      location: { city: "San Francisco", state: "CA", country: "USA" },
      skillsOffered: ["Graphic Design", "Figma"],
      skillsWanted: ["JavaScript", "CSS Animations"],
      level: "Expert",
      bio: "Design student who wants to learn how to code my designs.",
      rating: 4.7,
      reviewCount: 15,
      avatar: "https://picsum.photos/seed/jordan/200",
      isVerified: false,
      blockedUsers: []
    },
    {
      id: "4",
      name: "Maya Patel",
      email: "maya@example.com",
      location: { city: "London", state: "Greater London", country: "UK" },
      skillsOffered: ["Public Speaking", "Content Writing"],
      skillsWanted: ["Python", "Data Visualization"],
      level: "Intermediate",
      bio: "Communications student interested in data storytelling.",
      rating: 4.6,
      reviewCount: 5,
      avatar: "https://picsum.photos/seed/maya/200",
      isVerified: true,
      blockedUsers: []
    },
    {
      id: "5",
      name: "Liam Wilson",
      email: "liam@example.com",
      location: { city: "Toronto", state: "ON", country: "Canada" },
      skillsOffered: ["Spanish", "French"],
      skillsWanted: ["Web Development", "React"],
      level: "Beginner",
      bio: "Linguistics student wanting to build a language learning app.",
      rating: 4.5,
      reviewCount: 3,
      avatar: "https://picsum.photos/seed/liam/200",
      isVerified: false,
      blockedUsers: []
    }
  ];

  let sessions = [];
  let messages = [];
  let reports = [];

  // API Routes
  app.get("/api/users", (req, res) => {
    res.json(users);
  });

  app.patch("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...req.body };
      res.json(users[index]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/reports", (req, res) => {
    const report = { ...req.body, id: Date.now().toString(), timestamp: new Date().toISOString() };
    reports.push(report);
    res.status(201).json(report);
  });

  app.get("/api/sessions", (req, res) => {
    res.json(sessions);
  });

  app.post("/api/sessions", (req, res) => {
    const newSession = { ...req.body, id: Date.now().toString() };
    sessions.push(newSession);
    res.status(201).json(newSession);
  });

  app.patch("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...req.body };
      res.json(sessions[index]);
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  });

  app.get("/api/messages", (req, res) => {
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const newMessage = { ...req.body, id: Date.now().toString(), timestamp: new Date().toISOString() };
    messages.push(newMessage);
    res.status(201).json(newMessage);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
