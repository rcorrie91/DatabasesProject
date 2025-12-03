import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = "music_artists.db"

def add_ratings_to_existing_records():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            ALTER TABLE user_artist_tracking ADD COLUMN rating INTEGER
        """)
        print("✓ Added rating column to user_artist_tracking table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("✓ Rating column already exists")
        else:
            print(f"Note: {e}")
    
    try:
        cursor.execute("""
            ALTER TABLE user_artist_tracking ADD COLUMN rating_date DATE
        """)
        print("✓ Added rating_date column to user_artist_tracking table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("✓ Rating_date column already exists")
        else:
            print(f"Note: {e}")
    
    conn.commit()
    
    cursor.execute("""
        SELECT id, date_seen 
        FROM user_artist_tracking 
        WHERE rating IS NULL
    """)
    
    records = cursor.fetchall()
    
    if not records:
        print("No records found without ratings.")
        return
    
    print(f"Found {len(records)} records without ratings.")
    print("Adding ratings to existing records...")
    print()
    
    updated_count = 0
    
    for record_id, date_seen in records:
        rating = random.randint(6, 10)
        
        if date_seen:
            if isinstance(date_seen, str):
                try:
                    date_obj = datetime.strptime(date_seen.split()[0], '%Y-%m-%d')
                except:
                    date_obj = datetime.strptime(date_seen, '%Y-%m-%d %H:%M:%S.%f')
            else:
                date_obj = date_seen
            rating_date = date_obj + timedelta(days=random.randint(0, 7))
        else:
            rating_date = datetime.now() - timedelta(days=random.randint(1, 30))
        
        try:
            cursor.execute("""
                UPDATE user_artist_tracking
                SET rating = ?, rating_date = ?
                WHERE id = ?
            """, (rating, rating_date.strftime('%Y-%m-%d'), record_id))
            
            updated_count += 1
            
            if updated_count % 10 == 0:
                print(f"  Updated {updated_count} records...")
                
        except Exception as e:
            print(f"Error updating record {record_id}: {e}")
    
    conn.commit()
    
    print()
    print(f"✓ Successfully added ratings to {updated_count} records")
    
    cursor.execute("SELECT COUNT(*) FROM user_artist_tracking WHERE rating IS NOT NULL")
    total_with_ratings = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM user_artist_tracking")
    total_records = cursor.fetchone()[0]
    
    print()
    print("=" * 60)
    print("Summary:")
    print(f"  Total records: {total_records}")
    print(f"  Records with ratings: {total_with_ratings}")
    print(f"  Records without ratings: {total_records - total_with_ratings}")
    print("=" * 60)
    
    conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Adding ratings to existing user_artist_tracking records")
    print("=" * 60)
    print()
    
    add_ratings_to_existing_records()
    
    print()
    print("✅ Done!")

