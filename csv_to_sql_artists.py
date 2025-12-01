import sqlite3
import csv
from pathlib import Path

# Change these if you want different filenames/paths
CSV_PATH = Path("Global Music Artists.csv")
DB_PATH = Path("music_artists.db")


def create_schema(conn: sqlite3.Connection) -> None:
    """
    Create the artists and artist_genres tables in the SQLite database.
    This gives you:
    - A primary key (artist_id)
    - A separate table for genres (1 row per artist/genre)
    - A foreign key relationship between them
    """
    cur = conn.cursor()

    # Make sure foreign keys are enforced in SQLite
    cur.execute("PRAGMA foreign_keys = ON;")

    # Main artist table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS artists (
            artist_id   TEXT PRIMARY KEY,        -- Spotify ID, unique per artist
            artist_name TEXT NOT NULL,           -- Full name of the artist
            artist_img  TEXT,                    -- URL to profile image
            country     TEXT                     -- Country/region
        );
        """
    )

    # Junction table: one row per (artist, genre)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS artist_genres (
            artist_id TEXT NOT NULL,
            genre     TEXT NOT NULL,
            PRIMARY KEY (artist_id, genre),
            FOREIGN KEY (artist_id)
                REFERENCES artists(artist_id)
                ON DELETE CASCADE
        );
        """
    )

    conn.commit()


def load_csv_into_db(conn: sqlite3.Connection, csv_path: Path) -> None:
    """
    Read the CSV file and insert rows into artists and artist_genres.
    Assumes columns: artist_name, artist_genre, artist_img, artist_id, country
    Ignores any extra/unexpected columns.
    """
    cur = conn.cursor()

    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Basic cleanup / safety
            artist_id = (row.get("artist_id") or "").strip()
            artist_name = (row.get("artist_name") or "").strip()
            artist_img = (row.get("artist_img") or "").strip()
            country = (row.get("country") or "").strip()
            genres_str = (row.get("artist_genre") or "").strip()

            # Skip rows with no ID or no name (shouldn't really happen, but just in case)
            if not artist_id or not artist_name:
                continue

            # Insert into artists (ignore if already there)
            cur.execute(
                """
                INSERT OR IGNORE INTO artists (artist_id, artist_name, artist_img, country)
                VALUES (?, ?, ?, ?);
                """,
                (artist_id, artist_name, artist_img, country),
            )

            # Split genres by comma and insert each one into artist_genres
            if genres_str:
                for raw_genre in genres_str.split(","):
                    genre = raw_genre.strip()
                    if not genre:
                        continue

                    cur.execute(
                        """
                        INSERT OR IGNORE INTO artist_genres (artist_id, genre)
                        VALUES (?, ?);
                        """,
                        (artist_id, genre),
                    )

    conn.commit()


def main() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV file not found: {CSV_PATH}")

    # Connect (this will create the DB file if it doesn't exist)
    conn = sqlite3.connect(DB_PATH)

    try:
        create_schema(conn)
        load_csv_into_db(conn, CSV_PATH)
    finally:
        conn.close()

    print(f"✅ Done! Loaded data from '{CSV_PATH}' into SQLite DB '{DB_PATH}'.")


if __name__ == "__main__":
    main()
