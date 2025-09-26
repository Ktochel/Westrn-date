const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
    console.log('Starting full database setup...');

    // --- Удаляем старые таблицы для чистой установки ---
    db.run(`DROP TABLE IF EXISTS user_services`);
    db.run(`DROP TABLE IF EXISTS services`);
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`DROP TABLE IF EXISTS girls`);
    db.run(`DROP TABLE IF EXISTS admins`);
    db.run(`DROP TABLE IF EXISTS testimonials`);
    console.log('Old tables dropped.');

    // --- Создаем таблицы с правильной структурой ---
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, user_id_text TEXT NOT NULL UNIQUE, main_balance REAL NOT NULL DEFAULT 0, cashback_balance REAL NOT NULL DEFAULT 0, active_service_id INTEGER, last_viewed_girl_id INTEGER)`);
    db.run(`CREATE TABLE services (id INTEGER PRIMARY KEY, name_key TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, description TEXT, price REAL, is_fixed_price BOOLEAN NOT NULL)`);
    db.run(`CREATE TABLE user_services (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, service_id INTEGER NOT NULL, custom_price REAL NOT NULL, FOREIGN KEY (user_id) REFERENCES users (id), FOREIGN KEY (service_id) REFERENCES services (id))`);
    db.run(`CREATE TABLE girls (id INTEGER PRIMARY KEY, girl_id_text TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL, photo_url TEXT)`);
    db.run(`CREATE TABLE admins (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin')`);
    db.run(`CREATE TABLE testimonials (id INTEGER PRIMARY KEY, author_name TEXT NOT NULL, testimonial_text TEXT NOT NULL, date TEXT)`);
    console.log("All tables created successfully.");

    // --- Заполняем таблицу Услуг ---
    const services = [
        { key: 'contact_exchange', name: 'Обмен контактов', desc: 'Обменяйтесь контактными данными с девушкой для прямого общения.', price: 1000, fixed: true },
        { key: 'organize_meeting', name: 'Организовать встречу с девушкой', desc: 'Мы поможем организовать вашу первую встречу в реальной жизни.', price: 8000, fixed: true },
        { key: 'document_processing', name: 'Оформление документов', desc: 'Помощь со всеми необходимыми документами для ее поездки.', price: null, fixed: false },
        { key: 'ticket_purchase', name: 'Покупка билетов', desc: 'Покупка авиабилетов для девушки.', price: null, fixed: false },
        { key: 'medicine', name: 'Медицина', desc: 'Покрытие медицинских расходов или страховки.', price: null, fixed: false },
        { key: 'vibration', name: 'Вибрация', desc: 'Особая услуга для поддержания связи на расстоянии.', price: null, fixed: false },
        { key: 'surprise', name: 'Сделать сюрприз девушке', desc: 'Организуйте незабываемый сюрприз для вашей особенной девушки.', price: null, fixed: false }
    ];
    
    const stmt = db.prepare("INSERT INTO services (name_key, display_name, description, price, is_fixed_price) VALUES (?, ?, ?, ?, ?)");
    services.forEach(s => {
        stmt.run(s.key, s.name, s.desc, s.price, s.fixed);
    });
    stmt.finalize();
    console.log("Services table populated.");
});

db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Database setup complete. Closed the database connection.');
});