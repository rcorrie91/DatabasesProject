const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper function to generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to create a session
function createSession(userId, callback) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO user_sessions (user_id, session_token, expires_at, is_online, last_activity)
     VALUES (?, ?, ?, 1, ?)`,
    [userId, sessionToken, expiresAt.toISOString(), now],
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { sessionToken, expiresAt, sessionId: this.lastID });
      }
    }
  );
}

// Helper function to validate session
// A session is considered online only if last_activity was within the last 5 minutes
function validateSession(sessionToken, callback) {
  db.get(
    `SELECT us.*, u.email, u.first_name, u.last_name, u.nickname
     FROM user_sessions us
     JOIN users u ON us.user_id = u.id
     WHERE us.session_token = ?
       AND us.is_online = 1
       AND datetime(us.expires_at) > datetime('now')
       AND datetime(us.last_activity) > datetime('now', '-5 minutes')`,
    [sessionToken],
    callback
  );
}

// Helper function to update last activity for a session
function updateLastActivity(sessionToken, callback) {
  const now = new Date().toISOString();
  db.run(
    `UPDATE user_sessions
     SET last_activity = ?
     WHERE session_token = ? AND is_online = 1`,
    [now, sessionToken],
    callback
  );
}

// Helper function to deactivate session (set user offline)
function deactivateSession(sessionToken, callback) {
  db.run(
    `UPDATE user_sessions SET is_online = 0 WHERE session_token = ?`,
    [sessionToken],
    callback
  );
}

// Helper function to clean up expired and inactive sessions
// Sets users offline if their session has expired or they haven't been active in the last 5 minutes
function cleanupExpiredSessions() {
  db.run(
    `UPDATE user_sessions SET is_online = 0
     WHERE is_online = 1 AND (
       datetime(expires_at) < datetime('now')
       OR datetime(last_activity) < datetime('now', '-5 minutes')
     )`,
    (err) => {
      if (err) {
        console.error('Error cleaning up expired sessions:', err);
      }
    }
  );
}

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

    db.run(`
      ALTER TABLE user_artist_tracking ADD COLUMN rating INTEGER
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding rating column:', err);
      }
    });

    db.run(`
      ALTER TABLE user_artist_tracking ADD COLUMN event_country TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding event_country column:', err);
      }
    });

    // Run cleanup on startup
    cleanupExpiredSessions();
    // Run cleanup every hour
    setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
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

      // Update last login timestamp
      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        (err) => {
          if (err) {
            console.error('Error updating last login:', err);
          }
        }
      );

      // Create a new session
      createSession(user.id, (err, sessionData) => {
        if (err) {
          console.error('Error creating session:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }

        res.json({
          message: 'Login successful',
          sessionToken: sessionData.sessionToken,
          expiresAt: sessionData.expiresAt,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            nickname: user.nickname
          }
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ error: 'Session token is required' });
  }

  deactivateSession(sessionToken, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }

    res.json({ message: 'Logged out successfully' });
  });
});

// Validate session endpoint
app.post('/api/validate-session', (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ error: 'Session token is required' });
  }

  validateSession(sessionToken, (err, session) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Update last activity when validating session
    updateLastActivity(sessionToken, (updateErr) => {
      if (updateErr) {
        console.error('Error updating last activity:', updateErr);
      }
    });

    res.json({
      valid: true,
      user: {
        id: session.user_id,
        email: session.email,
        first_name: session.first_name,
        last_name: session.last_name,
        nickname: session.nickname
      },
      expiresAt: session.expires_at
    });
  });
});

// Heartbeat endpoint to keep session active
// Frontend should call this periodically while user is on the page
app.post('/api/heartbeat', (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ error: 'Session token is required' });
  }

  validateSession(sessionToken, (err, session) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    updateLastActivity(sessionToken, (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ error: 'Failed to update activity' });
      }

      res.json({ message: 'Heartbeat received', active: true });
    });
  });
});

// Get sessions for a user with online status
app.get('/api/user/:userId/sessions', (req, res) => {
  const { userId } = req.params;

  db.all(
    `SELECT id, session_token, created_at, expires_at, is_online, last_activity,
     CASE
       WHEN is_online = 1
         AND datetime(last_activity) > datetime('now', '-5 minutes')
         AND datetime(expires_at) > datetime('now')
       THEN 1
       ELSE 0
     END as currently_online
     FROM user_sessions
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
    (err, sessions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(sessions);
    }
  );
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

// Add artist to user's tracking list
app.post('/api/user/:userId/artists', (req, res) => {
  const { userId } = req.params;
  const { artist_id, date_seen, venue, city, notes, rating, event_country } = req.body;

  if (!artist_id) {
    return res.status(400).json({ error: 'Artist ID is required' });
  }

  db.run(
    `INSERT INTO user_artist_tracking (user_id, artist_id, date_seen, venue, city, notes, rating, event_country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, artist_id, date_seen || null, venue || null, city || null, notes || null, rating || null, event_country || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add artist' });
      }

      res.status(201).json({
        message: 'Artist added successfully',
        trackingId: this.lastID
      });
    }
  );
});

// Get users who have also seen a specific artist
app.get('/api/artists/:artistId/fans', (req, res) => {
  const { artistId } = req.params;

  db.all(
    `SELECT DISTINCT
       u.id,
       u.first_name,
       u.last_name,
       u.nickname,
       up.profile_image_url,
       up.city,
       up.state,
       COUNT(uat.artist_id) as times_seen
     FROM user_artist_tracking uat
     JOIN users u ON uat.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE uat.artist_id = ?
     GROUP BY u.id, u.first_name, u.last_name, u.nickname, up.profile_image_url, up.city, up.state
     ORDER BY times_seen DESC, u.nickname`,
    [artistId],
    (err, fans) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(fans);
    }
  );
});

// Get user's tracked artists
app.get('/api/user/:userId/artists', (req, res) => {
  const { userId } = req.params;

  db.all(
    `SELECT
       uat.id as tracking_id,
       uat.artist_id,
       uat.date_seen,
       uat.venue,
       uat.city,
       uat.notes,
       COALESCE(uat.rating, NULL) as rating,
       uat.event_country,
       a.artist_name,
       a.artist_img,
       a.country as artist_country
     FROM user_artist_tracking uat
     JOIN artists a ON uat.artist_id = a.artist_id
     WHERE uat.user_id = ?
     ORDER BY uat.date_seen DESC, uat.id DESC`,
    [userId],
    (err, artists) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (artists.length === 0) {
        return res.json([]);
      }

      let processedCount = 0;
      artists.forEach((artist) => {
        db.all(
          'SELECT genre FROM artist_genres WHERE artist_id = ?',
          [artist.artist_id],
          (err, genres) => {
            if (err) {
              artist.genres = [];
            } else {
              artist.genres = genres.map(g => g.genre);
            }
            processedCount++;
            if (processedCount === artists.length) {
              res.json(artists);
            }
          }
        );
      });
    }
  );
});

// Change user password
app.post('/api/user/:userId/change-password', async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    // Get current user
    db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedNewPassword, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update password' });
          }

          res.json({ message: 'Password changed successfully' });
        }
      );
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});