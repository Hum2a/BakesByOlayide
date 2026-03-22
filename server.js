const path = require('path');

// Repo root .env (preferred in docs) then backend/.env so local setups that only use backend/.env still work.
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

require('./backend/server'); 