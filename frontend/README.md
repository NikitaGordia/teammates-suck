# Team Balancer Frontend

![React](https://img.shields.io/badge/react-18.2.0-61DAFB.svg) ![Vite](https://img.shields.io/badge/vite-4.4.9-646CFF.svg) ![Node.js](https://img.shields.io/badge/node-18.x-339933.svg) ![i18next](https://img.shields.io/badge/i18next-22.5.0-26A69A.svg) ![Vitest](https://img.shields.io/badge/vitest-0.34.1-6E9F18.svg) ![CSS](https://img.shields.io/badge/css-modules-1572B6.svg) ![Language](https://img.shields.io/badge/language-Ukrainian/English-yellow.svg)

A React-based frontend for the Team Balancer application that allows users to create balanced teams for games or activities based on player skill levels.

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and development server
- **CSS** - Styling (with component-specific CSS files)
- **Fetch API** - For backend communication
- **i18next** - Internationalization framework (Ukrainian as default language)

## Project Structure

```
frontend/
├── public/             # Static assets
├── src/                # Source code
│   ├── components/     # React components
│   ├── config.js       # Application configuration
│   ├── App.jsx         # Main application component
│   ├── App.css         # Main application styles
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Project dependencies and scripts
└── vite.config.js      # Vite configuration
```

## Setup

1. Make sure you have Node.js installed (version 14.x or higher recommended)

2. Install dependencies:
   ```bash
   # Navigate to the frontend directory
   cd frontend

   # Install dependencies
   npm install
   ```

3. Configure the backend URL:
   - The application is configured to connect to the backend at `http://127.0.0.1:5050` by default
   - If your backend runs on a different URL, create a `.env` file based on `.env.example` and set the `VITE_API_BASE_URL` variable
   - All API configuration is centralized in `src/config.js`

## Development

To start the development server:

```bash
npm run dev
```

This will start the Vite development server, typically at http://localhost:5173

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a production-ready build in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Features

- **Player Management**: Add, remove, and adjust player scores
- **Team Balancing**: Automatically balance players into two teams based on skill levels
- **Win/Loss Tracking**: Display player statistics from the SQLite database
- **Flexible Lobby**: Drag-and-drop user table with win/loss statistics
- **Admin Authentication**: Secure admin authentication for submitting game results
- **Randomness Control**: Adjust the randomness factor in team balancing
- **Clipboard Integration**: Easily copy team assignments to clipboard
- **Responsive Design**: Works on desktop and mobile devices
- **Internationalization**: Supports Ukrainian (default) and English languages
- **Developer Contacts**: Displays developer contact information

## API Integration

The frontend communicates with the backend through the following API endpoints:

- `GET /api/users` - Retrieves player data including scores, wins, and losses
- `POST /api/balance` - Balances teams based on provided player data and randomness factor
- `POST /api/submit_game` - Submits game results with winning team information

### Admin Authentication

The application uses a secure admin authentication system:

- Admin credentials are stored in the format `admin:password`
- Passwords are hashed with SHA256 and include salt for security
- Admin authentication is required for submitting game results
- Admin secrets are stored in cookies after successful authentication
- A logout button is provided to clear admin cookies

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Testing

The frontend includes a comprehensive test suite using Vitest and React Testing Library. To run the tests:

```bash
# Navigate to the frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode (tests will re-run when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

For more details about the tests, see the [tests README](src/test/README.md).

## Internationalization

The application uses i18next for internationalization:

- Ukrainian is the default language
- English is available as an alternative
- Language detection is based on browser settings
- Language can be switched using the language switcher in the UI
- All UI text is stored in translation files in `src/locales/`

## Related Projects

- [Team Balancer Backend](../backend/README.md) - Flask backend for this application
