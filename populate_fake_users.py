import sqlite3
import bcrypt
import random
from datetime import datetime, timedelta

DB_PATH = "music_artists.db"

# Fake user data
FIRST_NAMES = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason",
    "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia",
    "Lucas", "Harper", "Henry", "Evelyn", "Alexander"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"
]

NICKNAMES = [
    "MusicLover", "ConcertKing", "LiveMusicFan", "ShowGoer", "FestivalQueen",
    "RockFan", "JazzHead", "PopStar", "IndieKid", "MetalHead",
    "EDMVibes", "HipHopHead", "CountryFan", "BluesSoul", "PunkRocker",
    "ClassicalFan", "FolkLover", "ReggaeVibes", "LatinGroove", "KPopFan"
]

VENUES = [
    "Madison Square Garden", "The Fillmore", "Red Rocks Amphitheatre",
    "Hollywood Bowl", "Barclays Center", "The Forum", "Greek Theatre",
    "House of Blues", "The Roxy", "Staples Center", "Radio City Music Hall",
    "The Wiltern", "Brooklyn Steel", "Terminal 5", "Webster Hall",
    "Metro Chicago", "First Avenue", "9:30 Club", "The Troubadour", "Exit/In"
]

CITIES = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Nashville, TN",
    "Austin, TX", "Seattle, WA", "Portland, OR", "Denver, CO",
    "San Francisco, CA", "Boston, MA", "Philadelphia, PA", "Atlanta, GA",
    "Miami, FL", "Detroit, MI", "Minneapolis, MN", "Phoenix, AZ",
    "San Diego, CA", "Dallas, TX", "Houston, TX", "Cleveland, OH"
]

def generate_random_date(days_back=730):
    """Generate a random date within the last 'days_back' days."""
    days_ago = random.randint(1, days_back)
    return datetime.now() - timedelta(days=days_ago)

def create_fake_users(conn, num_users=20):
    """Create fake users with hashed passwords."""
    cursor = conn.cursor()
    users = []

    # Default password for all fake users
    password = "password123"
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    for i in range(num_users):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        nickname = f"{random.choice(NICKNAMES)}{random.randint(1, 99)}"
        email = f"{first_name.lower()}.{last_name.lower()}{i+1}@example.com"

        cursor.execute("""
            INSERT INTO users (email, password, first_name, last_name, nickname)
            VALUES (?, ?, ?, ?, ?)
        """, (email, hashed_password, first_name, last_name, nickname))

        user_id = cursor.lastrowid
        users.append({
            'id': user_id,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'nickname': nickname
        })

        print(f"Created user: {first_name} {last_name} ({nickname}) - {email}")

    conn.commit()
    return users

def get_random_artists(conn, count=5):
    """Get random artist IDs from the database."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT artist_id, artist_name
        FROM artists
        ORDER BY RANDOM()
        LIMIT ?
    """, (count,))
    return cursor.fetchall()

def create_concert_attendance(conn, users, concerts_per_user=5):
    """Create concert attendance records for each user."""
    cursor = conn.cursor()

    for user in users:
        artists = get_random_artists(conn, concerts_per_user)

        for artist_id, artist_name in artists:
            date_seen = generate_random_date(days_back=730)
            venue = random.choice(VENUES)
            city = random.choice(CITIES)

            notes_options = [
                f"Amazing show! {artist_name} was incredible!",
                f"Great energy at {venue}",
                f"One of the best concerts I've been to",
                f"Would definitely see {artist_name} again",
                f"Awesome performance in {city}",
                None  # Some users might not add notes
            ]
            notes = random.choice(notes_options)

            try:
                cursor.execute("""
                    INSERT INTO user_artist_tracking
                    (user_id, artist_id, date_seen, venue, city, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (user['id'], artist_id, date_seen, venue, city, notes))

                print(f"  → {user['first_name']} saw {artist_name} at {venue} on {date_seen.strftime('%Y-%m-%d')}")
            except sqlite3.IntegrityError:
                # Skip if duplicate entry
                pass

    conn.commit()

def update_concert_counts(conn):
    """Update the concerts_attended count in user_profiles."""
    cursor = conn.cursor()

    # First, ensure all users have a profile
    cursor.execute("""
        INSERT OR IGNORE INTO user_profiles (user_id)
        SELECT id FROM users
    """)

    # Update concert counts
    cursor.execute("""
        UPDATE user_profiles
        SET concerts_attended = (
            SELECT COUNT(*)
            FROM user_artist_tracking
            WHERE user_artist_tracking.user_id = user_profiles.user_id
        )
    """)

    conn.commit()

def main():
    print("=" * 60)
    print("Populating database with fake users and concert data")
    print("=" * 60)
    print()

    conn = sqlite3.connect(DB_PATH)

    try:
        # Create 20 fake users
        print("Creating 20 fake users...")
        users = create_fake_users(conn, num_users=20)
        print(f"\n✓ Created {len(users)} users\n")

        # Create concert attendance records (5 concerts per user)
        print("Creating concert attendance records...")
        create_concert_attendance(conn, users, concerts_per_user=5)
        print(f"\n✓ Created concert attendance records\n")

        # Update concert counts in profiles
        print("Updating user profiles...")
        update_concert_counts(conn)
        print("✓ Updated user profiles\n")

        # Show summary
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM user_artist_tracking")
        concert_count = cursor.fetchone()[0]

        print("=" * 60)
        print("Summary:")
        print(f"  Total users: {user_count}")
        print(f"  Total concert records: {concert_count}")
        print(f"  Average concerts per user: {concert_count / user_count:.1f}")
        print("=" * 60)
        print()
        print("✅ Database populated successfully!")
        print()
        print("Note: All fake users have the password: password123")

    finally:
        conn.close()

if __name__ == "__main__":
    main()
