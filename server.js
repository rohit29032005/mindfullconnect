// Import Express (web server) and SQLite3 (database)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify API key is loaded
if (!process.env.GOOGLE_API_KEY) {
  console.warn('Warning: GOOGLE_API_KEY not found in environment variables');
}

const app = express(); // Create server app
const port = 3001;     // Port to listen on

// Add a secret key for JWT
const JWT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'; // In production, use environment variables

// Middleware: lets server read JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Add CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

// Connect to database (creates file if not exists)
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('DB error', err);
  } else {
    console.log('Connected to DB');
    
    // First, create the users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name varchar(256) NOT NULL,
      email varchar(256) NOT NULL,
      password varchar(256) NOT NULL,
      role varchar(50) DEFAULT 'patient' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`, function(err) {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table ready');
      }
    });
  }
});

// GET /users: return all users as JSON
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ users: rows });
  });
});

// POST /users: add a user from request body
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ id: this.lastID });
  });
});

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = req.body.role || 'patient'; // Default role if not provided
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate role is either patient or practitioner
    if (role !== 'patient' && role !== 'practitioner') {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (user) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new user with role
      db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            message: 'User registered successfully',
            userId: this.lastID
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Find user by email
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    try {
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        userId: user.id,
        name: user.name
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Authentication middleware to protect routes
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.userData) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user role is included in the allowed roles
    if (roles.length && !roles.includes(req.userData.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  };
};

// Example protected route for patients only
app.get('/patient-dashboard', authenticate, authorize(['patient']), (req, res) => {
  res.json({ message: 'Patient dashboard data', userData: req.userData });
});

// Example protected route for practitioners only
app.get('/practitioner-dashboard', authenticate, authorize(['practitioner']), (req, res) => {
  res.json({ message: 'Practitioner dashboard data', userData: req.userData });
});

// Example protected route for both roles
app.get('/profile', authenticate, authorize(['patient', 'practitioner']), (req, res) => {
  res.json({ message: 'User profile data', userData: req.userData });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

/*
Backend summary:
- Express handles web requests.
- Middleware parses data.
- SQLite stores data.
- GET = read, POST = add.
- You can add more routes for update/delete.
*/
