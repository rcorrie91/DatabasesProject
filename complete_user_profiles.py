import sqlite3
import random

DB_PATH = "music_artists.db"

# Bio templates
BIO_TEMPLATES = [
    "Music lover and concert enthusiast. Always on the lookout for the next great show!",
    "Live music is my passion. Nothing beats the energy of a great concert.",
    "Avid concert-goer and music festival junkie. Love discovering new artists!",
    "Music is life! I've been to countless shows and can't get enough.",
    "Concert addict who lives for live music. Always adding new shows to my calendar!",
    "Passionate about live performances. There's nothing like experiencing music in person.",
    "Music fan who loves supporting artists by attending their concerts.",
    "Live music enthusiast with a diverse taste. From rock to jazz, I love it all!",
    "Concert lover since day one. The louder the better!",
    "Music brings me joy. I try to catch as many live shows as possible.",
    "Festival season is my favorite season. Love the atmosphere and energy!",
    "Always hunting for tickets to the next big show. Music is my therapy.",
    "Live for those moments when the bass drops and the crowd goes wild!",
    "Music nerd who appreciates good live sound. Quality matters!",
    "Concert photography enthusiast. Capturing memories one show at a time.",
    "Music collector and live show addict. My weekends are for concerts!",
    "Nothing beats singing along with thousands of other fans at a concert.",
    "Professional concert-goer. This is basically my second job!",
    "Music is my escape. Concerts are where I feel most alive.",
    "Always down for a good show. Who's playing this weekend?"
]

# Music genres
ALL_GENRES = [
    "Rock", "Pop", "Hip-Hop", "R&B", "Country", "Jazz", "Blues", "Electronic",
    "EDM", "House", "Techno", "Classical", "Metal", "Punk", "Indie", "Alternative",
    "Folk", "Reggae", "Latin", "K-Pop", "Soul", "Funk", "Gospel", "Disco",
    "Grunge", "Ska", "Bluegrass", "Ambient", "Trap", "Dubstep"
]

def get_random_genres(count=3):
    """Get a random selection of genres."""
    selected = random.sample(ALL_GENRES, min(count, len(ALL_GENRES)))
    return ", ".join(selected)

def complete_user_profiles(conn):
    """Fill in missing bio and favorite_genres for all users."""
    cursor = conn.cursor()

    # Get all user profiles
    cursor.execute("SELECT user_id FROM user_profiles")
    user_profiles = cursor.fetchall()

    print(f"Completing profiles for {len(user_profiles)} users...")
    print()

    for (user_id,) in user_profiles:
        # Select random bio
        bio = random.choice(BIO_TEMPLATES)

        # Select 2-4 random favorite genres
        num_genres = random.randint(2, 4)
        favorite_genres = get_random_genres(num_genres)

        # Update the user profile
        cursor.execute("""
            UPDATE user_profiles
            SET bio = ?,
                favorite_genres = ?
            WHERE user_id = ?
        """, (bio, favorite_genres, user_id))

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
            print(f"  Bio: {bio[:60]}...")
            print(f"  Favorite Genres: {favorite_genres}")
            print()

    conn.commit()

def main():
    print("=" * 70)
    print("Completing user profiles with bios and favorite genres")
    print("=" * 70)
    print()

    conn = sqlite3.connect(DB_PATH)

    try:
        complete_user_profiles(conn)

        # Show summary
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*)
            FROM user_profiles
            WHERE bio IS NOT NULL AND favorite_genres IS NOT NULL
        """)
        complete_profiles = cursor.fetchone()[0]

        print("=" * 70)
        print("Summary:")
        print(f"  Complete profiles: {complete_profiles}")
        print("=" * 70)
        print()
        print("✅ All user profiles are now complete!")

    finally:
        conn.close()

if __name__ == "__main__":
    main()
