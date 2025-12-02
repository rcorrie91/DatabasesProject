import sqlite3
import csv
from pathlib import Path
from datetime import datetime

# Configuration
CSV_PATH = Path("books_data.csv")
DB_PATH = Path("books_library.db")


def create_schema(conn: sqlite3.Connection) -> None:
    """
    Create a comprehensive books/library database schema.

    Tables:
    - authors: Author information
    - publishers: Publisher information
    - genres: Book genres
    - books: Main book information
    - book_authors: Many-to-many relationship (books can have multiple authors)
    - book_genres: Many-to-many relationship (books can have multiple genres)
    - users: User accounts for reading tracking
    - user_profiles: Extended user profile information
    - user_reading: Track which books users have read
    - user_reviews: User reviews and ratings
    """
    cur = conn.cursor()

    # Enable foreign keys
    cur.execute("PRAGMA foreign_keys = ON;")

    # Authors table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS authors (
            author_id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_name TEXT NOT NULL,
            birth_year INTEGER,
            country TEXT,
            biography TEXT,
            author_img TEXT
        );
    """)

    # Publishers table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS publishers (
            publisher_id INTEGER PRIMARY KEY AUTOINCREMENT,
            publisher_name TEXT NOT NULL UNIQUE,
            country TEXT,
            founded_year INTEGER
        );
    """)

    # Genres table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS genres (
            genre_id INTEGER PRIMARY KEY AUTOINCREMENT,
            genre_name TEXT NOT NULL UNIQUE
        );
    """)

    # Books table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS books (
            book_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            publisher_id INTEGER,
            publication_year INTEGER,
            isbn TEXT UNIQUE,
            page_count INTEGER,
            language TEXT,
            description TEXT,
            cover_img TEXT,
            FOREIGN KEY (publisher_id) REFERENCES publishers(publisher_id)
        );
    """)

    # Book-Authors junction table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS book_authors (
            book_id TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            author_order INTEGER DEFAULT 1,
            PRIMARY KEY (book_id, author_id),
            FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
            FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
        );
    """)

    # Book-Genres junction table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS book_genres (
            book_id TEXT NOT NULL,
            genre_id INTEGER NOT NULL,
            PRIMARY KEY (book_id, genre_id),
            FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
            FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE
        );
    """)

    # Users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1
        );
    """)

    # User profiles table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            bio TEXT,
            favorite_genres TEXT,
            books_read_count INTEGER DEFAULT 0,
            profile_image_url TEXT,
            city TEXT,
            country TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
    """)

    # User reading tracking table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_reading (
            reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id TEXT NOT NULL,
            status TEXT CHECK(status IN ('want_to_read', 'reading', 'completed', 'abandoned')),
            date_started DATETIME,
            date_completed DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
            UNIQUE(user_id, book_id)
        );
    """)

    # User reviews table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_reviews (
            review_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id TEXT NOT NULL,
            rating INTEGER CHECK(rating >= 1 AND rating <= 5),
            review_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
            UNIQUE(user_id, book_id)
        );
    """)

    # Triggers for timestamp updates
    cur.execute("""
        CREATE TRIGGER IF NOT EXISTS update_users_timestamp
        AFTER UPDATE ON users
        BEGIN
            UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
        END;
    """)

    cur.execute("""
        CREATE TRIGGER IF NOT EXISTS update_profiles_timestamp
        AFTER UPDATE ON user_profiles
        BEGIN
            UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE profile_id = NEW.profile_id;
        END;
    """)

    cur.execute("""
        CREATE TRIGGER IF NOT EXISTS update_reviews_timestamp
        AFTER UPDATE ON user_reviews
        BEGIN
            UPDATE user_reviews SET updated_at = CURRENT_TIMESTAMP WHERE review_id = NEW.review_id;
        END;
    """)

    conn.commit()


def load_csv_into_db(conn: sqlite3.Connection, csv_path: Path) -> None:
    """
    Read the books CSV file and populate the database.
    Expected CSV columns: book_id, title, authors, genres, publisher,
                         publication_year, isbn, page_count, language, description, cover_img
    """
    cur = conn.cursor()

    if not csv_path.exists():
        print(f"⚠️  CSV file not found: {csv_path}")
        print("Creating empty database with schema only.")
        return

    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Extract and clean data
            book_id = (row.get("book_id") or "").strip()
            title = (row.get("title") or "").strip()
            authors_str = (row.get("authors") or "").strip()
            genres_str = (row.get("genres") or "").strip()
            publisher_name = (row.get("publisher") or "").strip()
            pub_year = (row.get("publication_year") or "").strip()
            isbn = (row.get("isbn") or "").strip()
            page_count = (row.get("page_count") or "").strip()
            language = (row.get("language") or "").strip()
            description = (row.get("description") or "").strip()
            cover_img = (row.get("cover_img") or "").strip()

            # Skip if missing critical fields
            if not book_id or not title:
                continue

            # Handle publisher
            publisher_id = None
            if publisher_name:
                cur.execute(
                    "INSERT OR IGNORE INTO publishers (publisher_name) VALUES (?);",
                    (publisher_name,)
                )
                cur.execute(
                    "SELECT publisher_id FROM publishers WHERE publisher_name = ?;",
                    (publisher_name,)
                )
                publisher_id = cur.fetchone()[0]

            # Insert book
            cur.execute(
                """
                INSERT OR IGNORE INTO books
                (book_id, title, publisher_id, publication_year, isbn, page_count, language, description, cover_img)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    book_id,
                    title,
                    publisher_id,
                    int(pub_year) if pub_year.isdigit() else None,
                    isbn if isbn else None,
                    int(page_count) if page_count.isdigit() else None,
                    language if language else None,
                    description if description else None,
                    cover_img if cover_img else None
                )
            )

            # Handle authors
            if authors_str:
                for author_name in authors_str.split(";"):
                    author_name = author_name.strip()
                    if not author_name:
                        continue

                    # Insert or get author
                    cur.execute(
                        "INSERT OR IGNORE INTO authors (author_name) VALUES (?);",
                        (author_name,)
                    )
                    cur.execute(
                        "SELECT author_id FROM authors WHERE author_name = ?;",
                        (author_name,)
                    )
                    author_id = cur.fetchone()[0]

                    # Link book to author
                    cur.execute(
                        "INSERT OR IGNORE INTO book_authors (book_id, author_id) VALUES (?, ?);",
                        (book_id, author_id)
                    )

            # Handle genres
            if genres_str:
                for genre_name in genres_str.split(","):
                    genre_name = genre_name.strip()
                    if not genre_name:
                        continue

                    # Insert or get genre
                    cur.execute(
                        "INSERT OR IGNORE INTO genres (genre_name) VALUES (?);",
                        (genre_name,)
                    )
                    cur.execute(
                        "SELECT genre_id FROM genres WHERE genre_name = ?;",
                        (genre_name,)
                    )
                    genre_id = cur.fetchone()[0]

                    # Link book to genre
                    cur.execute(
                        "INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?);",
                        (book_id, genre_id)
                    )

    conn.commit()


def main() -> None:
    # Connect to database (creates file if it doesn't exist)
    conn = sqlite3.connect(DB_PATH)

    try:
        print(f"📚 Creating books library database: {DB_PATH}")
        create_schema(conn)
        print("✅ Schema created successfully")

        load_csv_into_db(conn, CSV_PATH)

        # Print some stats
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM books;")
        book_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM authors;")
        author_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM genres;")
        genre_count = cur.fetchone()[0]

        print(f"✅ Database created with:")
        print(f"   - {book_count} books")
        print(f"   - {author_count} authors")
        print(f"   - {genre_count} genres")

    finally:
        conn.close()

    print(f"✅ Done! Books library database saved to '{DB_PATH}'")


if __name__ == "__main__":
    main()
