const { initializeDb } = require('./connection');

initializeDb()
    .then(() => {
        console.log('Database initialization completed.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Database initialization failed:', err.message);
        process.exit(1);
    });
