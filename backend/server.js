// Local development / long-running server entry (Render, local machine).
// Vercel does NOT use this file — it uses ../app.js (root) instead.
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.ready()
  .then(() => {
    console.log('Database initialized');
    app.listen(PORT, () => {
      console.log(`
╭────────────────────────────────────╮
│  Renewal Radar Backend             │
│  Server running on port ${PORT}       │
│  Environment: ${process.env.NODE_ENV}       │
╰────────────────────────────────────╯
      `);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

