const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./music_artists.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to music_artists.db database');
    console.log('All user and artist tables are already set up and ready to use');
    
    db.run(`
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error('Error creating users update trigger:', err);
      }
    });

    db.run(`
      CREATE TRIGGER IF NOT EXISTS update_profiles_timestamp 
      AFTER UPDATE ON user_profiles
      BEGIN
        UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error('Error creating profiles update trigger:', err);
      }
    });
  }
});

app.post('/api/register', async (req, res) => {
  const { email, password, first_name, last_name, nickname } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!first_name || !last_name || !nickname) {
    return res.status(400).json({ error: 'First name, last name, and nickname are required' });
  }

  try {
    db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ error: 'Account already exists with this email' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        'INSERT INTO users (email, password, first_name, last_name, nickname) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, first_name, last_name, nickname],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create account' });
          }

          res.status(201).json({
            message: 'Account created successfully',
            userId: this.lastID
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ 
        error: 'No account found with this email. Please create a new account.' 
      });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        (err) => {
          if (err) {
            console.error('Error updating last login:', err);
          }
        }
      );
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          nickname: user.nickname
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});