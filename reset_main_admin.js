const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// --- Ваши новые данные для главного админа ---
const newUsername = 'qimora.vx_708';
const newPassword = 'T4v@9mQ!1zR^7pL#6xG&2Nh8';
// ---------------------------------------------

const db = new sqlite3.Database('./db.sqlite', (err) => {
    if (err) return console.error('Error connecting:', err.message);
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // Хешируем новый пароль
    const hashedPassword = bcrypt.hashSync(newPassword, 12);

    // Обновляем данные для администратора с ID = 1
    const updateSql = `UPDATE admins SET username = ?, password = ? WHERE id = 1`;
    
    db.run(updateSql, [newUsername, hashedPassword], function(err) {
        if (err) {
            return console.error('Error updating main admin:', err.message);
        }
        if (this.changes === 0) {
            console.log('Main admin (ID=1) not found. Nothing changed.');
        } else {
            console.log(`Main admin credentials have been successfully updated!`);
            console.log(`New Username: ${newUsername}`);
        }
    });
});

db.close((err) => {
    if (err) return console.error(err.message);
    console.log('Closed the database connection.');
});