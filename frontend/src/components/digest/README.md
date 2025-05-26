# Digest Components

This directory contains components for displaying game statistics and analytics in a modern, interactive digest format.

## Components

### DigestModal.jsx
The main modal component that displays the digest data with a tilted background effect and scrollable content.

**Features:**
- Responsive design with modern styling
- Loading states with animated spinner
- Error handling
- Scrollable content with custom scrollbar
- Download functionality for game data
- ESC key and click-outside-to-close functionality

### RankChangesChart.jsx
Displays player status changes (promotions/demotions) with:
- Dual-axis bar chart (games played vs win rate)
- Color-coded status badges
- Interactive tooltips
- Responsive grid layout for player information

### TopPlayersChart.jsx
Shows the most active players with:
- Colorful bar chart
- Top 5 players list with rankings
- Game count visualization
- Responsive design

### TopAdminsChart.jsx
Displays admin contributions with:
- Bar chart showing games managed
- Admin ranking list
- Color-coded visualization

### ActivityCharts.jsx
Provides multiple activity visualizations:
- Hourly activity chart (24-hour format)
- Weekly activity chart (by day of week)
- Responsive chart containers
- Localized day names

## Styling

All components use modern CSS with:
- Gradient backgrounds
- Box shadows and hover effects
- Smooth animations and transitions
- Responsive design patterns
- Custom scrollbars
- Color-coded data visualization

## Localization

All text is fully localized with support for:
- English (EN)
- Ukrainian (UK)

Translation keys are organized under the `digest` namespace in the translation files.

## Dependencies

- Chart.js 4.4.0
- react-chartjs-2 5.2.0
- React 18.2.0
- react-i18next for internationalization

## Usage

The digest functionality is integrated into the LanguageSwitcher component and can be accessed via the "Latest Digest" button in the application header.

## API Integration

The components consume data from:
- `/api/digest` - Main digest data endpoint
- `/api/digest/games` - Game data download endpoint

## Testing

Each component includes comprehensive tests covering:
- Rendering with different data states
- Loading and error states
- User interactions
- Responsive behavior
