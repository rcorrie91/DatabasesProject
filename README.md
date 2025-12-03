# Music Artists Tracker

A full-stack web application for tracking live music events and artists you've seen perform. Users can register, add artists they've seen, rate performances, and filter their concert history by various criteria.

## Features

- **User Authentication**: Secure registration and login system with session management
- **Artist Tracking**: Add artists you've seen live with details like venue, date, location, and personal rating
- **Advanced Filtering**: Filter your concert history by:
  - Rating (1-10)
  - Date range
  - Country
  - City
  - Genre
- **Dashboard**: View statistics and browse your tracked artists
- **Artist Database**: Access to a comprehensive database of global music artists with genres and country information
- **Password Management**: Securely change your password

## Tech Stack

### Backend
- **Node.js** with Express
- **SQLite3** database
- **bcryptjs** for password hashing
- **CORS** for cross-origin resource sharing

### Frontend
- **React 18**
- **React Router** for navigation
- **CSS3** for styling

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts
- `user_profiles` - Extended user profile information
- `user_sessions` - Session management
- `artists` - Global artists database
- `artist_genres` - Artist genre associations
- `user_artist_tracking` - User's tracked concert experiences

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Python 3** (for database setup scripts)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DatabasesProject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**

   The database file `music_artists.db` should already be included in the project. If you need to recreate it or populate it with data, you can use the Python scripts included:

   ```bash
   # Create and populate the artists database from CSV
   python csv_to_music_tracker_sql.py

   # (Optional) Populate with fake users for testing
   python populate_fake_users.py
   ```

## Running the Application

You have several options to run the application:

### Option 1: Run Frontend and Backend Separately

**Terminal 1 - Start the backend server:**
```bash
npm run server
```
The backend will start on `http://localhost:3001`

**Terminal 2 - Start the frontend:**
```bash
npm start
```
The frontend will start on `http://localhost:3000`

### Option 2: Run Both Concurrently (Recommended)

```bash
npm run dev
```
This will start both the frontend and backend simultaneously.

### Option 3: Frontend Only

```bash
npm start
```

## Available Scripts

- `npm start` - Runs the React frontend in development mode
- `npm run server` - Starts the Express backend server
- `npm run dev` - Runs both frontend and backend concurrently
- `npm run build` - Builds the frontend for production
- `npm test` - Runs frontend tests
- `npm run eject` - Ejects from Create React App (one-way operation)

## Usage

1. **Register an Account**
   - Navigate to `http://localhost:3000`
   - Click "Register" and create a new account
   - Provide email, password, first name, last name, and nickname

2. **Login**
   - Use your credentials to log in
   - Session tokens are stored in localStorage

3. **Add Artists**
   - Navigate to the Artist Tracker page
   - Search for artists from the database
   - Add details about when and where you saw them
   - Rate your experience (1-10)

4. **View Dashboard**
   - See statistics about your concert history
   - Filter by rating, date, location, or genre
   - View all your tracked artists

5. **Manage Account**
   - Change your password from the settings page

## API Endpoints

### Authentication
- `POST /api/register` - Create a new user account
- `POST /api/login` - Login and create session
- `POST /api/logout` - Logout and invalidate session
- `POST /api/validate-session` - Validate an active session

### User Management
- `GET /api/user/:userId/sessions` - Get user's active sessions
- `POST /api/user/:userId/change-password` - Change user password
- `GET /api/user/:userId/artists` - Get user's tracked artists
- `POST /api/user/:userId/artists` - Add artist to user's tracking list

### Artist Search
- `GET /api/search/artists?query=<search>` - Search for artists
- `GET /api/search/genres?query=<search>` - Get available genres
- `GET /api/search/countries?query=<search>` - Get available countries
- `GET /api/artists/:artistId` - Get specific artist details
- `GET /api/artists/:artistId/fans` - Get users who have seen an artist

### Health Check
- `GET /api/health` - Server health check

## Project Structure

```
DatabasesProject/
├── src/                          # React frontend source
│   ├── components/              # React components
│   │   ├── LandingPage.js      # Landing page
│   │   ├── LoginPage.js        # Login page
│   │   ├── RegisterPage.js     # Registration page
│   │   ├── Dashboard.js        # Main dashboard with filters
│   │   ├── ArtistTracker.js    # Add artists page
│   │   ├── MyArtists.js        # View tracked artists
│   │   ├── ChangePassword.js   # Password change page
│   │   └── SearchableDropdown.js # Reusable search component
│   ├── App.js                   # Main app component with routing
│   ├── index.js                 # React entry point
│   └── *.css                    # Component styles
├── public/                      # Public assets
├── server.js                    # Express backend server
├── music_artists.db            # SQLite database
├── package.json                 # Node dependencies and scripts
└── *.py                         # Python database setup scripts
```

## Database Utility Scripts

- `csv_to_music_tracker_sql.py` - Import artist data from CSV
- `csv_to_sql_artists.py` - Alternative artist import script
- `populate_fake_users.py` - Generate test users
- `update_user_profiles.py` - Update user profile data
- `complete_user_profiles.py` - Complete user profile information
- `add_ratings_to_existing.py` - Add ratings to existing records
- `update_event_country_and_add_artists.py` - Update event countries

## Troubleshooting

### Port Already in Use
If port 3001 or 3000 is already in use:
```bash
# Find and kill the process using the port (macOS/Linux)
lsof -ti:3001 | xargs kill
lsof -ti:3000 | xargs kill
```

### Database Issues
If you encounter database errors:
1. Ensure `music_artists.db` exists in the project root
2. Check file permissions
3. Try recreating the database using the Python scripts

### Module Not Found
If you get module errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development

### Frontend Development
The React app uses hot reloading, so changes will automatically reflect in the browser.

### Backend Development
Restart the server after making changes to `server.js`:
```bash
npm run server
```

## Security Features

- Password hashing with bcryptjs
- Session-based authentication with expiration
- SQL injection prevention through parameterized queries
- CORS protection
- Secure password requirements

## Future Enhancements

Potential features to add:
- Photo uploads for concert memories
- Social features (follow other users)
- Concert recommendations
- Export functionality
- Mobile responsive design improvements
- Artist pages with detailed information
- Concert calendar integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is for educational purposes.

## Contact

For questions or issues, please open an issue in the repository.
