# Team Balancer Frontend

A React-based frontend for the Team Balancer application that allows users to create balanced teams for games or activities based on player skill levels.

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and development server
- **CSS** - Styling (with component-specific CSS files)
- **Fetch API** - For backend communication

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
- **Randomness Control**: Adjust the randomness factor in team balancing
- **Clipboard Integration**: Easily copy team assignments to clipboard
- **Responsive Design**: Works on desktop and mobile devices

## API Integration

The frontend communicates with the backend through the following API endpoints:

- `GET /api/get_mappings` - Retrieves player score mappings from the database
- `POST /api/balance` - Balances teams based on provided player data and randomness factor

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Related Projects

- [Team Balancer Backend](../backend/README.md) - Flask backend for this application
