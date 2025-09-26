const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
    const addColumnSql = "ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'";
    db.run(addColumnSql, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            return console.error('Error adding role column:', err.message);
        }
        console.log("Column 'role' added or already exists.");
    });

    const updateRoleSql = "UPDATE admins SET role = 'superadmin' WHERE id = 1";
    db.run(updateRoleSql, function(err) {
        if (err) return console.error('Error setting superadmin role:', err.message);
        if (this.changes > 0) {
            console.log("Main admin has been assigned 'superadmin' role.");
        }
    });
});

db.close();