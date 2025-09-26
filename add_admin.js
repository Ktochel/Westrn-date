const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./db.sqlite', (err) => {
    if (err) return console.error('Error connecting:', err.message);
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // 1. Создаем таблицу для администраторов
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    `;
    db.run(createTableSql, (err) => {
        if (err) return console.error('Error creating admins table:', err.message);
        console.log("Table 'admins' is ready.");
    });

    // 2. Создаем первого администратора
    const username = 'admin';
    const password = 'admin123';
    // Хешируем пароль перед сохранением
    const hashedPassword = bcrypt.hashSync(password, 10);

    const insertSql = `INSERT INTO admins (username, password) VALUES (?, ?)`;
    db.run(insertSql, [username, hashedPassword], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                console.log('Admin user already exists.');
            } else {
                return console.error('Error inserting admin:', err.message);
            }
        } else {
            console.log(`Default admin user ('admin'/'admin123') has been created.`);
        }
    });
});

db.close((err) => {
    if (err) return console.error(err.message);
    console.log('Closed the database connection.');
});