import sqlite3
import random

DB_PATH = "music_artists.db"

# Profile image URLs (using placeholder images)
PROFILE_IMAGES = [
    "https://i.pravatar.cc/300?img=1",
    "https://i.pravatar.cc/300?img=2",
    "https://i.pravatar.cc/300?img=3",
    "https://i.pravatar.cc/300?img=5",
    "https://i.pravatar.cc/300?img=6",
    "https://i.pravatar.cc/300?img=7",
    "https://i.pravatar.cc/300?img=8",
    "https://i.pravatar.cc/300?img=9",
    "https://i.pravatar.cc/300?img=10",
    "https://i.pravatar.cc/300?img=11",
    "https://i.pravatar.cc/300?img=12",
    "https://i.pravatar.cc/300?img=13",
    "https://i.pravatar.cc/300?img=14",
    "https://i.pravatar.cc/300?img=15",
    "https://i.pravatar.cc/300?img=16",
    "https://i.pravatar.cc/300?img=17",
    "https://i.pravatar.cc/300?img=18",
    "https://i.pravatar.cc/300?img=19",
    "https://i.pravatar.cc/300?img=20",
    "https://i.pravatar.cc/300?img=21"
]

# US Cities and States
CITIES_STATES = [
    ("New York", "NY"),
    ("Los Angeles", "CA"),
    ("Chicago", "IL"),
    ("Houston", "TX"),
    ("Phoenix", "AZ"),
    ("Philadelphia", "PA"),
    ("San Antonio", "TX"),
    ("San Diego", "CA"),
    ("Dallas", "TX"),
    ("San Jose", "CA"),
    ("Austin", "TX"),
    ("Jacksonville", "FL"),
    ("Fort Worth", "TX"),
    ("Columbus", "OH"),
    ("San Francisco", "CA"),
    ("Charlotte", "NC"),
    ("Indianapolis", "IN"),
    ("Seattle", "WA"),
    ("Denver", "CO"),
    ("Boston", "MA"),
    ("Nashville", "TN"),
    ("Detroit", "MI"),
    ("Portland", "OR"),
    ("Las Vegas", "NV"),
    ("Memphis", "TN"),
    ("Louisville", "KY"),
    ("Baltimore", "MD"),
    ("Milwaukee", "WI"),
    ("Albuquerque", "NM"),
    ("Tucson", "AZ")
]

COUNTRIES = ["USA", "United States", "US", "United States of America"]

def update_user_profiles(conn):
    """Update existing user profiles with profile images, cities, states, and countries."""
    cursor = conn.cursor()

    # Get all user IDs
    cursor.execute("SELECT user_id FROM user_profiles")
    user_profiles = cursor.fetchall()

    print(f"Updating {len(user_profiles)} user profiles...")
    print()

    for (user_id,) in user_profiles:
        # Select random profile image
        profile_image = random.choice(PROFILE_IMAGES)

        # Select random city and state
        city, state = random.choice(CITIES_STATES)

        # Select random country
        country = random.choice(COUNTRIES)

        # Update the user profile
        cursor.execute("""
            UPDATE user_profiles
            SET profile_image_url = ?,
                city = ?,
                state = ?,
                country = ?
            WHERE user_id = ?
        """, (profile_image, city, state, country, user_id))

        # Get user info for display
        cursor.execute("""
            SELECT first_name, last_name, nickname
            FROM users
            WHERE id = ?
        """, (user_id,))

        user = cursor.fetchone()
        if user:
            first_name, last_name, nickname = user
            print(f"✓ Updated {first_name} {last_name} ({nickname})")
            print(f"  Profile: {profile_image}")
            print(f"  Location: {city}, {state}, {country}")
            print()

    conn.commit()

def main():
    print("=" * 60)
    print("Updating user profiles with images and locations")
    print("=" * 60)
    print()

    conn = sqlite3.connect(DB_PATH)

    try:
        update_user_profiles(conn)

        # Show summary
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*)
            FROM user_profiles
            WHERE profile_image_url IS NOT NULL
        """)
        profiles_with_images = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*)
            FROM user_profiles
            WHERE city IS NOT NULL AND state IS NOT NULL
        """)
        profiles_with_location = cursor.fetchone()[0]

        print("=" * 60)
        print("Summary:")
        print(f"  Profiles with images: {profiles_with_images}")
        print(f"  Profiles with location: {profiles_with_location}")
        print("=" * 60)
        print()
        print("✅ User profiles updated successfully!")

    finally:
        conn.close()

if __name__ == "__main__":
    main()
