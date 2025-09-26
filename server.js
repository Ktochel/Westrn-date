const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// --- DATABASE CONNECTION ---
const db = new sqlite3.Database('./db.sqlite', (err) => {
    if (err) return console.error('Error connecting to database:', err.message);
    console.log('Connected to the SQLite database.');
});

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- SESSION SETUP ---
app.use(session({
    secret: 'a-very-strong-secret-key-that-you-should-change',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24-hour session
}));

// --- SECURITY MIDDLEWARE ---
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect('/admin_login.html');
};

// --- USER API ROUTES ---
app.post('/api/login', (req, res) => {
    const { email, user_id } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND user_id_text = ?`, [email, user_id], (err, user) => {
        if (err) return res.status(500).json({ message: "Server error" });
        if (user) {
            req.session.userId = user.id;
            res.json({ status: 'success', redirectUrl: '/main.html', userData: user });
        } else {
            // Если пользователя нет - создаем нового
            db.run(`INSERT INTO users (email, user_id_text) VALUES (?, ?)`, [email, user_id], function(err) {
                if (err) return res.status(500).json({ message: 'Could not create new user.' });
                const newUserId = this.lastID;
                db.get(`SELECT * FROM users WHERE id = ?`, [newUserId], (err, newUser) => {
                    req.session.userId = newUser.id;
                    res.json({ status: 'success', redirectUrl: '/main.html', userData: newUser });
                });
            });
        }
    });
});

app.post('/api/get-profile-data', (req, res) => {
    if (!req.session.userId && !req.body.userId) return res.status(401).json({ message: 'Not authenticated' });
    const userId = req.session.userId || req.body.userId;
    
    const responseData = {};
    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
        if (!user) return res.status(404).json({ message: 'User not found' });
        responseData.user = user;
        db.all(`SELECT s.*, us.custom_price FROM services s LEFT JOIN user_services us ON s.id = us.service_id AND us.user_id = ?`, [userId], (err, services) => {
            responseData.services = services;
            res.json({ profileData: responseData });
        });
    });
});

app.post('/api/select-service', (req, res) => {
    const userId = req.session.userId;
    const { serviceId } = req.body;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    db.get(`SELECT * FROM services WHERE id = ?`, [serviceId], (err, service) => {
        if (!service) return res.status(404).json({ message: 'Service not found' });

        const price = service.price || 0; // Если цена не фиксирована, админ ее установит позже
        db.run(`INSERT INTO user_services (user_id, service_id, custom_price) VALUES (?, ?, ?) ON CONFLICT(user_id, service_id) DO NOTHING;`, [userId, serviceId, price]);
        db.run(`UPDATE users SET active_service_id = ? WHERE id = ?`, [serviceId, userId], (err) => {
            if (err) return res.status(500).json({ message: 'Failed to activate service' });
            res.json({ status: 'success', message: 'Service selected' });
        });
    });
});

// --- ADMIN API ROUTES ---
app.get('/admin', isAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM admins WHERE username = ?`, [username], (err, admin) => {
        if (!admin || !bcrypt.compareSync(password, admin.password)) {
            return res.json({ success: false, message: 'Invalid credentials.' });
        }
        req.session.isAdmin = true;
        res.json({ success: true });
    });
});

app.get('/api/admin/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin_login.html'));
});

app.post('/api/admin/find-user', isAdmin, (req, res) => {
    db.get(`SELECT * FROM users WHERE user_id_text = ?`, [req.body.userId], (err, user) => {
        if (user) {
            db.all(`SELECT s.*, us.custom_price FROM services s LEFT JOIN user_services us ON s.id = us.service_id AND us.user_id = ?`, [user.id], (err, services) => {
                res.json({ status: 'success', user: user, services: services });
            });
        } else {
            res.json({ status: 'error', message: 'User not found.' });
        }
    });
});

app.post('/api/admin/update-balances', isAdmin, (req, res) => {
    const { userId, mainBalance, cashbackBalance } = req.body;
    const sql = `UPDATE users SET main_balance = ?, cashback_balance = ? WHERE id = ?`;
    db.run(sql, [mainBalance, cashbackBalance, userId], (err) => res.json({ message: 'Balances updated.' }));
});

app.post('/api/admin/increment-action', isAdmin, (req, res) => {
    const { userId, actionType } = req.body;
    const amount = actionType === 'video' ? 10 : 6;
    const sql = `UPDATE users SET main_balance = main_balance + ? WHERE id = ?`;
    db.run(sql, [amount, userId], function(err) {
        if (err) return res.status(500).json({ message: 'Error updating balance.' });
        db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
            res.json({ status: 'success', updatedUser: user });
        });
    });
});

app.post('/api/admin/set-service-price', isAdmin, (req, res) => {
    const { userId, serviceId, price } = req.body;
    const findSql = `SELECT id FROM user_services WHERE user_id = ? AND service_id = ?`;
    db.get(findSql, [userId, serviceId], (err, row) => {
        if (row) {
            db.run(`UPDATE user_services SET custom_price = ? WHERE id = ?`, [price, row.id], (err) => res.json({ message: 'Price updated.' }));
        } else {
            db.run(`INSERT INTO user_services (user_id, service_id, custom_price) VALUES (?, ?, ?)`, [userId, serviceId, price], (err) => res.json({ message: 'Price set.' }));
        }
    });
});

// --- PUBLIC ROUTES (for index page) ---
app.get('/api/testimonials', (req, res) => {
    db.all("SELECT * FROM testimonials ORDER BY id DESC LIMIT 6", [], (err, rows) => {
        res.json({ testimonials: rows });
    });
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});