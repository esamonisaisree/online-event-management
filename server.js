
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

const db = new sqlite3.Database(
    path.join(__dirname, "database", "events.db")
);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "event-management-secret",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, "public")));

const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

const get = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

const all = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

// Initialize database
async function initializeDatabase() {
    await run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'student'
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            event_date TEXT NOT NULL,
            venue TEXT NOT NULL,
            capacity INTEGER DEFAULT 100
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, event_id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(event_id) REFERENCES events(id)
        )
    `);

    // Create default admin
    const admin = await get(
        "SELECT id FROM users WHERE email = ?",
        ["admin@event.com"]
    );

    if (!admin) {
        const password = await bcrypt.hash("Admin@123", 10);

        await run(
            "INSERT INTO users(name,email,password,role) VALUES(?,?,?,'admin')",
            ["Administrator", "admin@event.com", password]
        );
    }

    // Insert sample events
    const result = await get(
        "SELECT COUNT(*) AS total FROM events"
    );

    if (result.total === 0) {
        const events = [
            [
                "Technical Symposium",
                "A technical event featuring coding and project presentations.",
                "2026-12-05",
                "College Auditorium",
                100
            ],
            [
                "Cultural Fest",
                "Music, dance and cultural activities.",
                "2026-12-12",
                "Open Air Stage",
                200
            ],
            [
                "AI Workshop",
                "Learn about Artificial Intelligence and Machine Learning.",
                "2026-12-18",
                "Seminar Hall",
                80
            ]
        ];

        for (const event of events) {
            await run(
                `INSERT INTO events
                (title,description,event_date,venue,capacity)
                VALUES(?,?,?,?,?)`,
                event
            );
        }
    }

    console.log("Database initialized successfully.");
}

// Authentication middleware
function authenticate(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            error: "Please login first."
        });
    }
    next();
}

function adminOnly(req, res, next) {
    if (!req.session.user ||
        req.session.user.role !== "admin") {
        return res.status(403).json({
            error: "Admin access required."
        });
    }
    next();
}

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "Server running successfully" });
});

// Current user
app.get("/api/me", (req, res) => {
    res.json({ user: req.session.user || null });
});

// Student registration
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                error: "Enter a valid email."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must have at least 6 characters."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await run(
            "INSERT INTO users(name,email,password) VALUES(?,?,?)",
            [name.trim(), email.trim().toLowerCase(), hashedPassword]
        );

        req.session.user = {
            id: result.lastID,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: "student"
        };

        res.status(201).json({
            message: "Registration successful!",
            user: req.session.user
        });

    } catch (error) {
        if (error.message.includes("UNIQUE")) {
            return res.status(409).json({
                error: "Email already registered."
            });
        }

        res.status(500).json({
            error: "Registration failed."
        });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    try {
        const email = (req.body.email || "").trim().toLowerCase();

        const user = await get(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (!user ||
            !(await bcrypt.compare(
                req.body.password || "",
                user.password
            ))) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({
            message: "Login successful!",
            user: req.session.user
        });

    } catch {
        res.status(500).json({ error: "Login failed." });
    }
});

// Logout
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out successfully." });
    });
});

// Display all events
app.get("/api/events", async (req, res) => {
    try {
        const events = await all(`
            SELECT e.*,
            (SELECT COUNT(*) FROM registrations r
             WHERE r.event_id = e.id) AS registered_count
            FROM events e
            ORDER BY event_date
        `);

        res.json(events);
    } catch {
        res.status(500).json({ error: "Unable to load events." });
    }
});

// Register for an event
app.post("/api/events/:id/register",
    authenticate,
    async (req, res) => {
        try {
            if (req.session.user.role !== "student") {
                return res.status(403).json({
                    error: "Only students can register."
                });
            }

            const event = await get(
                "SELECT * FROM events WHERE id = ?",
                [req.params.id]
            );

            if (!event) {
                return res.status(404).json({
                    error: "Event not found."
                });
            }

            const count = await get(
                "SELECT COUNT(*) AS total FROM registrations WHERE event_id = ?",
                [event.id]
            );

            if (count.total >= event.capacity) {
                return res.status(409).json({
                    error: "Event is full."
                });
            }

            await run(
                "INSERT INTO registrations(user_id,event_id) VALUES(?,?)",
                [req.session.user.id, event.id]
            );

            res.status(201).json({
                message: "Event registration confirmed!"
            });

        } catch (error) {
            if (error.message.includes("UNIQUE")) {
                return res.status(409).json({
                    error: "Already registered for this event."
                });
            }

            res.status(500).json({
                error: "Event registration failed."
            });
        }
    }
);

// Student registered events
app.get("/api/my-registrations",
    authenticate,
    async (req, res) => {
        const registrations = await all(`
            SELECT e.*, r.registered_at
            FROM registrations r
            JOIN events e ON e.id = r.event_id
            WHERE r.user_id = ?
            ORDER BY e.event_date
        `, [req.session.user.id]);

        res.json(registrations);
    }
);

// Admin: View all participants
app.get("/api/admin/participants",
    adminOnly,
    async (req, res) => {
        const participants = await all(`
            SELECT u.name, u.email, e.title,
                   e.event_date, r.registered_at
            FROM registrations r
            JOIN users u ON u.id = r.user_id
            JOIN events e ON e.id = r.event_id
            ORDER BY e.event_date
        `);

        res.json(participants);
    }
);

// Admin: Create event
app.post("/api/admin/events",
    adminOnly,
    async (req, res) => {
        const { title, description, event_date, venue, capacity } = req.body;

        if (!title || !event_date || !venue) {
            return res.status(400).json({
                error: "Title, date and venue are required."
            });
        }

        const result = await run(`
            INSERT INTO events
            (title,description,event_date,venue,capacity)
            VALUES(?,?,?,?,?)
        `, [
            title,
            description || "",
            event_date,
            venue,
            Math.max(1, Number(capacity) || 100)
        ]);

        res.status(201).json({
            message: "Event created successfully.",
            id: result.lastID
        });
    }
);

// Start server
initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error("Database error:", error);
        process.exit(1);
    });
