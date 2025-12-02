import csv
from pathlib import Path

# ========= CONFIG =========
CSV_PATH = Path("Global Music Artists.csv")  # input CSV
SQL_OUTPUT_PATH = Path("music_tracker_schema_and_data.sql")  # output SQL
# ==========================


def sql_escape(value: str) -> str:
    """
    Escape single quotes for SQL string literals.
    Example: O'Brien -> O''Brien
    """
    return value.replace("'", "''")


def write_schema(out):
    """
    Write BCNF schema for the music tracker app.

    Tables:
      - genres(genre_id, genre_name)
      - artists(artist_id, artist_name, artist_img, country, genre_id)
      - users(user_id, user_name, email, password_hash, fav_genre_id, country, created_at)
      - user_artist(user_id, artist_id, seen_date, rating)
    """
    out.write("-- Schema for Music Tracker (BCNF)\n\n")

    # Drop in FK-safe order (children first)
    out.write("DROP TABLE IF EXISTS user_artist;\n")
    out.write("DROP TABLE IF EXISTS users;\n")
    out.write("DROP TABLE IF EXISTS artists;\n")
    out.write("DROP TABLE IF EXISTS genres;\n\n")

    # GENRES (BCNF: genre_id -> genre_name)
    out.write(
        "CREATE TABLE genres (\n"
        "    genre_id   INTEGER PRIMARY KEY,\n"
        "    genre_name VARCHAR(255) NOT NULL UNIQUE\n"
        ");\n\n"
    )

    # ARTISTS (BCNF: artist_id -> artist_name, artist_img, country, genre_id)
    out.write(
        "CREATE TABLE artists (\n"
        "    artist_id   VARCHAR(64) PRIMARY KEY,\n"
        "    artist_name VARCHAR(255) NOT NULL,\n"
        "    artist_img  VARCHAR(512),\n"
        "    country     VARCHAR(128),\n"
        "    genre_id    INTEGER,\n"
        "    FOREIGN KEY (genre_id) REFERENCES genres(genre_id)\n"
        ");\n\n"
    )

    # USERS (BCNF: user_id key; email also unique key)
    out.write(
        "CREATE TABLE users (\n"
        "    user_id       INTEGER PRIMARY KEY,\n"
        "    user_name     VARCHAR(255),\n"
        "    email         VARCHAR(255) NOT NULL UNIQUE,\n"
        "    password_hash VARCHAR(255) NOT NULL,\n"
        "    fav_genre_id  INTEGER,\n"
        "    country       VARCHAR(128),\n"
        "    created_at    DATE,\n"
        "    FOREIGN KEY (fav_genre_id) REFERENCES genres(genre_id)\n"
        ");\n\n"
    )

    # USER_ARTIST (BCNF: (user_id, artist_id, seen_date) is key)
    out.write(
        "CREATE TABLE user_artist (\n"
        "    user_id    INTEGER NOT NULL,\n"
        "    artist_id  VARCHAR(64) NOT NULL,\n"
        "    seen_date  DATE NOT NULL,\n"
        "    rating     INTEGER,\n"
        "    PRIMARY KEY (user_id, artist_id, seen_date),\n"
        "    FOREIGN KEY (user_id) REFERENCES users(user_id),\n"
        "    FOREIGN KEY (artist_id) REFERENCES artists(artist_id)\n"
        ");\n\n"
    )

    # Normalization notes for the report
    out.write(
        "-- Normalization notes (BCNF):\n"
        "--   genres: genre_id -> genre_name (genre_id is key)\n"
        "--   artists: artist_id -> artist_name, artist_img, country, genre_id\n"
        "--   users: user_id -> all attrs, email -> all attrs (both are keys)\n"
        "--   user_artist: (user_id, artist_id, seen_date) -> rating\n\n"
    )


def load_csv(csv_path: Path):
    """
    Load the CSV and:
      - take only the FIRST genre before the comma
      - build a genre dictionary
      - build artist rows referencing genre_id
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    genres = {}  # key: normalized genre name (lowercase); value: (genre_id, display_name)
    next_genre_id = 1

    artists = []  # list of dicts with artist fields
    seen_artist_ids = set()

    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            artist_id = (row.get("artist_id") or "").strip()
            artist_name = (row.get("artist_name") or "").strip()
            artist_img = (row.get("artist_img") or "").strip()
            country = (row.get("country") or "").strip()
            genres_str = (row.get("artist_genre") or "").strip()

            # Skip rows with no ID or name
            if not artist_id or not artist_name:
                continue

            # Deduplicate by artist_id
            if artist_id in seen_artist_ids:
                continue
            seen_artist_ids.add(artist_id)

            # Take ONLY the first genre before the comma
            first_genre = None
            if genres_str:
                first_genre = genres_str.split(",")[0].strip()
                if not first_genre:
                    first_genre = None

            genre_id = None
            if first_genre:
                key = first_genre.lower()
                if key not in genres:
                    genres[key] = (next_genre_id, first_genre)
                    next_genre_id += 1
                genre_id = genres[key][0]

            artists.append(
                {
                    "artist_id": artist_id,
                    "artist_name": artist_name,
                    "artist_img": artist_img,
                    "country": country,
                    "genre_id": genre_id,
                }
            )

    return genres, artists


def write_data(out, csv_path: Path):
    """
    Generate INSERT statements for genres and artists
    based on the CSV content.
    """
    genres, artists = load_csv(csv_path)

    out.write("-- Data for genres and artists loaded from CSV\n")
    out.write("START TRANSACTION;\n\n")

    # Insert genres
    for _, (gid, gname) in sorted(genres.items(), key=lambda kv: kv[1][0]):
        esc_name = sql_escape(gname)
        out.write(
            "INSERT INTO genres (genre_id, genre_name)\n"
            f"VALUES ({gid}, '{esc_name}');\n"
        )
    out.write("\n")

    # Insert artists
    for a in artists:
        esc_id = sql_escape(a["artist_id"])
        esc_name = sql_escape(a["artist_name"])
        img = a["artist_img"]
        country = a["country"]
        gid = a["genre_id"]

        img_sql = "NULL" if not img else f"'{sql_escape(img)}'"
        country_sql = "NULL" if not country else f"'{sql_escape(country)}'"
        genre_sql = "NULL" if gid is None else str(gid)

        out.write(
            "INSERT INTO artists (artist_id, artist_name, artist_img, country, genre_id)\n"
            f"VALUES ('{esc_id}', '{esc_name}', {img_sql}, {country_sql}, {genre_sql});\n"
        )

    out.write("\nCOMMIT;\n")


def main():
    with SQL_OUTPUT_PATH.open("w", encoding="utf-8") as out:
        write_schema(out)
        write_data(out, CSV_PATH)

    print(f"✅ Wrote schema + data to {SQL_OUTPUT_PATH}")


if __name__ == "__main__":
    main()