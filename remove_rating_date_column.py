import sqlite3

DB_PATH = "music_artists.db"

def remove_rating_date_column():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Removing rating_date column from user_artist_tracking table...")
    print("Note: SQLite doesn't support DROP COLUMN directly, so we'll recreate the table.")
    print()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_artist_tracking_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            artist_id TEXT NOT NULL,
            date_seen DATE,
            venue TEXT,
            city TEXT,
            notes TEXT,
            rating INTEGER,
            event_country TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (artist_id) REFERENCES artists(artist_id)
        )
    """)
    
    cursor.execute("""
        INSERT INTO user_artist_tracking_new 
        (id, user_id, artist_id, date_seen, venue, city, notes, rating, event_country)
        SELECT id, user_id, artist_id, date_seen, venue, city, notes, rating, event_country
        FROM user_artist_tracking
    """)
    
    cursor.execute("DROP TABLE user_artist_tracking")
    cursor.execute("ALTER TABLE user_artist_tracking_new RENAME TO user_artist_tracking")
    
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM user_artist_tracking")
    count = cursor.fetchone()[0]
    
    print(f"✓ Successfully removed rating_date column")
    print(f"✓ Preserved {count} records")
    print()
    print("✅ Database updated successfully!")
    
    conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Removing rating_date column from user_artist_tracking")
    print("=" * 60)
    print()
    
    remove_rating_date_column()

