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
  const { email, password, first_name, last_name, nickname, profile_image, city, state, country } = req.body;

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

          const userId = this.lastID;

          // Create user profile with additional information
          db.run(
            'INSERT INTO user_profiles (user_id, profile_image_url, city, state, country) VALUES (?, ?, ?, ?, ?)',
            [userId, profile_image || null, city || null, state || null, country || null],
            function(profileErr) {
              if (profileErr) {
                console.error('Error creating user profile:', profileErr);
              }

              res.status(201).json({
                message: 'Account created successfully',
                userId: userId
              });
            }
          );
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

// Search artists endpoint
app.get('/api/search/artists', (req, res) => {
  const { query, limit = 20 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  db.all(
    `SELECT artist_id, artist_name, artist_img, country
     FROM artists
     WHERE artist_name LIKE ?
     ORDER BY artist_name
     LIMIT ?`,
    [`%${query}%`, parseInt(limit)],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get all unique genres
app.get('/api/search/genres', (req, res) => {
  const { query } = req.query;

  let sql = 'SELECT DISTINCT genre FROM artist_genres ORDER BY genre';
  let params = [];

  if (query) {
    sql = 'SELECT DISTINCT genre FROM artist_genres WHERE genre LIKE ? ORDER BY genre';
    params = [`%${query}%`];
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows.map(row => row.genre));
  });
});

// Get all unique countries
app.get('/api/search/countries', (req, res) => {
  const { query } = req.query;

  let sql = 'SELECT DISTINCT country FROM artists WHERE country IS NOT NULL ORDER BY country';
  let params = [];

  if (query) {
    sql = 'SELECT DISTINCT country FROM artists WHERE country IS NOT NULL AND country LIKE ? ORDER BY country';
    params = [`%${query}%`];
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows.map(row => row.country));
  });
});

// Get artist by ID with genres
app.get('/api/artists/:artistId', (req, res) => {
  const { artistId } = req.params;

  db.get(
    'SELECT artist_id, artist_name, artist_img, country FROM artists WHERE artist_id = ?',
    [artistId],
    (err, artist) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!artist) {
        return res.status(404).json({ error: 'Artist not found' });
      }

      // Get genres for this artist
      db.all(
        'SELECT genre FROM artist_genres WHERE artist_id = ?',
        [artistId],
        (err, genres) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          artist.genres = genres.map(g => g.genre);
          res.json(artist);
        }
      );
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});