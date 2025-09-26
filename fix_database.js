const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
    const addColumnSql = "ALTER TABLE users ADD COLUMN last_viewed_girl_id INTEGER";

    db.run(addColumnSql, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column 'last_viewed_girl_id' already exists. No action needed.");
            } else {
                return console.error('Error adding column to users table:', err.message);
            }
        } else {
            console.log("Successfully added 'last_viewed_girl_id' column to users table.");
        }
    });
});

db.close();