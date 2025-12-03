import sqlite3
import random
from datetime import datetime, timedelta

try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False
    print("Warning: bcrypt not available, will check for existing user only")

DB_PATH = "music_artists.db"

CITY_TO_COUNTRY = {
    "New York, NY": "United States",
    "Los Angeles, CA": "United States",
    "Chicago, IL": "United States",
    "Nashville, TN": "United States",
    "Austin, TX": "United States",
    "Seattle, WA": "United States",
    "Portland, OR": "United States",
    "Denver, CO": "United States",
    "San Francisco, CA": "United States",
    "Boston, MA": "United States",
    "Philadelphia, PA": "United States",
    "Atlanta, GA": "United States",
    "Miami, FL": "United States",
    "Detroit, MI": "United States",
    "Minneapolis, MN": "United States",
    "Phoenix, AZ": "United States",
    "San Diego, CA": "United States",
    "Dallas, TX": "United States",
    "Houston, TX": "United States",
    "Cleveland, OH": "United States",
    "London": "United Kingdom",
    "Manchester": "United Kingdom",
    "Birmingham": "United Kingdom",
    "Liverpool": "United Kingdom",
    "Paris": "France",
    "Lyon": "France",
    "Marseille": "France",
    "Berlin": "Germany",
    "Munich": "Germany",
    "Hamburg": "Germany",
    "Amsterdam": "Netherlands",
    "Rotterdam": "Netherlands",
    "Toronto": "Canada",
    "Vancouver": "Canada",
    "Montreal": "Canada",
    "Sydney": "Australia",
    "Melbourne": "Australia",
    "Tokyo": "Japan",
    "Osaka": "Japan",
    "Seoul": "South Korea",
    "Mexico City": "Mexico",
    "Barcelona": "Spain",
    "Madrid": "Spain",
    "Rome": "Italy",
    "Milan": "Italy",
    "Brussels": "Belgium",
    "Stockholm": "Sweden",
    "Copenhagen": "Denmark",
    "Oslo": "Norway",
    "Vienna": "Austria",
    "Zurich": "Switzerland",
    "Dublin": "Ireland",
    "Lisbon": "Portugal",
    "Athens": "Greece",
    "Warsaw": "Poland",
    "Prague": "Czech Republic",
    "Budapest": "Hungary",
    "Bucharest": "Romania",
    "Sao Paulo": "Brazil",
    "Rio de Janeiro": "Brazil",
    "Buenos Aires": "Argentina",
    "Santiago": "Chile",
    "Lima": "Peru",
    "Bogota": "Colombia",
    "Mumbai": "India",
    "Delhi": "India",
    "Bangalore": "India",
    "Shanghai": "China",
    "Beijing": "China",
    "Hong Kong": "China",
    "Singapore": "Singapore",
    "Bangkok": "Thailand",
    "Jakarta": "Indonesia",
    "Manila": "Philippines",
    "Cairo": "Egypt",
    "Johannesburg": "South Africa",
    "Lagos": "Nigeria",
    "Nairobi": "Kenya",
    "Dubai": "United Arab Emirates",
    "Tel Aviv": "Israel",
    "Istanbul": "Turkey",
    "Moscow": "Russia",
    "Saint Petersburg": "Russia",
    "Kiev": "Ukraine",
    "Warsaw": "Poland",
}

VENUES = [
    "Madison Square Garden", "The Fillmore", "Red Rocks Amphitheatre",
    "Hollywood Bowl", "Barclays Center", "The Forum", "Greek Theatre",
    "House of Blues", "The Roxy", "Staples Center", "Radio City Music Hall",
    "The Wiltern", "Brooklyn Steel", "Terminal 5", "Webster Hall",
    "Metro Chicago", "First Avenue", "9:30 Club", "The Troubadour", "Exit/In",
    "O2 Arena", "Wembley Stadium", "Royal Albert Hall", "Brixton Academy",
    "Olympia", "Zenith", "AccorHotels Arena", "Berghain", "Tempodrom",
    "Paradiso", "Melkweg", "Rogers Arena", "Commodore Ballroom",
    "Sydney Opera House", "Enmore Theatre", "Tokyo Dome", "Nippon Budokan",
    "Olympic Stadium", "Foro Sol", "Palau Sant Jordi", "WiZink Center",
    "Stadio Olimpico", "Mediolanum Forum", "Ancienne Belgique", "Globen",
    "Royal Arena", "Spektrum", "Wiener Stadthalle", "Hallenstadion",
    "3Arena", "MEO Arena", "OAKA", "Torwar Hall", "O2 Arena Prague",
    "Papp Laszlo Arena", "Sala Palatului", "Allianz Parque", "Maracana",
    "Luna Park", "Movistar Arena", "Jockey Club", "El Campin",
    "NSCI Dome", "Indira Gandhi Arena", "Kanteerava Stadium", "Mercedes-Benz Arena",
    "Workers Stadium", "Wukesong Arena", "AsiaWorld-Expo", "Marina Bay Sands",
    "Impact Arena", "Istora Senayan", "Mall of Asia Arena", "Cairo Stadium",
    "FNB Stadium", "Eko Hotel", "Kasarani Stadium", "Dubai Opera",
    "Menora Mivtachim Arena", "Vodafone Park", "Luzhniki Stadium", "Ice Palace",
    "Palace of Sports", "Torwar Hall"
]

def get_country_from_city(city):
    if not city:
        return None
    
    for city_key, country in CITY_TO_COUNTRY.items():
        if city_key.lower() == city.lower() or city.lower() in city_key.lower():
            return country
    
    if ", " in city:
        parts = city.split(", ")
        if len(parts) == 2:
            state_abbr = parts[1]
            if state_abbr in ["NY", "CA", "IL", "TN", "TX", "WA", "OR", "CO", "MA", "PA", "GA", "FL", "MI", "MN", "AZ", "OH"]:
                return "United States"
    
    return None

def add_event_country_column(conn):
    cursor = conn.cursor()
    try:
        cursor.execute("""
            ALTER TABLE user_artist_tracking ADD COLUMN event_country TEXT
        """)
        print("✓ Added event_country column to user_artist_tracking table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("✓ event_country column already exists")
        else:
            print(f"Note: {e}")
    conn.commit()

def update_existing_records(conn):
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, city FROM user_artist_tracking WHERE event_country IS NULL
    """)
    
    records = cursor.fetchall()
    
    if not records:
        print("No records found without event_country.")
        return
    
    print(f"Found {len(records)} records without event_country.")
    print("Updating existing records with event_country based on city...")
    
    updated_count = 0
    
    for record_id, city in records:
        country = get_country_from_city(city)
        
        if country:
            cursor.execute("""
                UPDATE user_artist_tracking
                SET event_country = ?
                WHERE id = ?
            """, (country, record_id))
            updated_count += 1
    
    conn.commit()
    print(f"✓ Updated {updated_count} records with event_country")

def get_or_create_test_user(conn):
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = ?", ("test@gmail.com",))
    user = cursor.fetchone()
    
    if user:
        user_id = user[0]
        print(f"✓ Found existing user test@gmail.com with ID: {user_id}")
        return user_id
    else:
        if HAS_BCRYPT:
            password = "password123"
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute("""
                INSERT INTO users (email, password, first_name, last_name, nickname)
                VALUES (?, ?, ?, ?, ?)
            """, ("test@gmail.com", hashed_password, "Test", "User", "TestUser"))
            
            user_id = cursor.lastrowid
            conn.commit()
            print(f"✓ Created new user test@gmail.com with ID: {user_id}")
            return user_id
        else:
            print("ERROR: test@gmail.com user does not exist and bcrypt is not available to create it.")
            print("Please create the user manually or install bcrypt: pip install bcrypt")
            return None

def get_random_artists(conn, count=25):
    cursor = conn.cursor()
    cursor.execute("""
        SELECT artist_id, artist_name
        FROM artists
        ORDER BY RANDOM()
        LIMIT ?
    """, (count,))
    return cursor.fetchall()

def generate_random_date(days_back=730):
    days_ago = random.randint(1, days_back)
    return datetime.now() - timedelta(days=days_ago)

def add_artists_to_test_user(conn, user_id, num_artists=25):
    cursor = conn.cursor()
    
    artists = get_random_artists(conn, num_artists)
    
    if not artists:
        print("No artists found in database!")
        return
    
    print(f"\nAdding {num_artists} artists to test@gmail.com account...")
    
    added_count = 0
    
    for artist_id, artist_name in artists:
        date_seen = generate_random_date(days_back=730)
        venue = random.choice(VENUES)
        city = random.choice(list(CITY_TO_COUNTRY.keys()))
        country = CITY_TO_COUNTRY[city]
        rating = random.randint(6, 10)
        rating_date = date_seen + timedelta(days=random.randint(0, 7))
        
        notes_options = [
            f"Amazing show! {artist_name} was incredible!",
            f"Great energy at {venue}",
            f"One of the best concerts I've been to",
            f"Would definitely see {artist_name} again",
            f"Awesome performance in {city}",
            None
        ]
        notes = random.choice(notes_options)
        
        try:
            cursor.execute("""
                INSERT INTO user_artist_tracking
                (user_id, artist_id, date_seen, venue, city, notes, rating, rating_date, event_country)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, artist_id, date_seen, venue, city, notes, rating, rating_date, country))
            
            added_count += 1
            print(f"  → Added {artist_name} at {venue} in {city}, {country} on {date_seen.strftime('%Y-%m-%d')}")
        except sqlite3.IntegrityError:
            pass
    
    conn.commit()
    print(f"\n✓ Successfully added {added_count} artists to test@gmail.com account")

def main():
    print("=" * 60)
    print("Updating database: Adding event_country and test user artists")
    print("=" * 60)
    print()
    
    conn = sqlite3.connect(DB_PATH)
    
    try:
        add_event_country_column(conn)
        print()
        
        update_existing_records(conn)
        print()
        
        user_id = get_or_create_test_user(conn)
        print()
        
        add_artists_to_test_user(conn, user_id, num_artists=25)
        print()
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM user_artist_tracking WHERE user_id = ?", (user_id,))
        total_artists = cursor.fetchone()[0]
        
        print("=" * 60)
        print("Summary:")
        print(f"  Total artists for test@gmail.com: {total_artists}")
        print("=" * 60)
        print()
        print("✅ Database updated successfully!")
        
    finally:
        conn.close()

if __name__ == "__main__":
    main()

