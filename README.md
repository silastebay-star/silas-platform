# SILAS Platform - Stoneclough Initiative for Local & Autonomous Systems

A production-ready community engagement platform built with React, Mapbox GL JS, and modern web technologies.

## 🌟 Features

- **Interactive Map**: Mapbox GL JS integration with custom style and community markers
- **Community Calendar**: Event listings with RSVP functionality
- **Polling System**: Community voting on local initiatives
- **Directory**: Organized listing of local businesses, groups, and organizations
- **Real-time Feedback**: Voting and commenting system for community engagement
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components
- **Data Integration**: CSV data loading for community statistics

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x or higher
- pnpm (pre-installed in the project)

### Installation

1. **Install dependencies:**
   ```bash
   cd silas-platform
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm run dev
   ```
   
   The application will be available at `http://localhost:5173`

3. **Build for production:**
   ```bash
   pnpm run build
   ```
   
   The built files will be in the `dist/` directory.

## 📁 Project Structure

```
silas-platform/
├── public/
│   ├── area_data.csv          # Community statistics data
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── silas-logo.png     # SILAS logo
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   ├── App.jsx                # Main application component
│   ├── App.css                # Global styles with Tailwind
│   └── main.jsx               # Application entry point
├── dist/                      # Production build output
└── package.json
```

## 🔧 Configuration

### Mapbox Integration

The application uses Mapbox GL JS with the following configuration:

- **Access Token**: `pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg`
- **Custom Style**: `mapbox://styles/silastebay/cmgaznfkx000f01qu43308dzx`
- **Center Coordinates**: Stoneclough, UK (Longitude: -2.3769, Latitude: 53.5526)

To update the Mapbox configuration, edit the constants in `src/App.jsx`:

```javascript
const MAPBOX_TOKEN = "your-token-here";
const MAPBOX_STYLE = "your-style-url-here";
```

### Theme Color

The primary theme color is `#4c764c` (green). To change it, update the `THEME` constant in `src/App.jsx`.

### Community Data

The CSV file at `public/area_data.csv` contains community statistics from the UK Census 2021. The data includes:

- Population: 4,300
- Households: 1,900
- Age demographics
- Household composition
- Health statistics
- And more...

To update the data, replace `public/area_data.csv` with your own CSV file following the same format.

## 🎨 Customization

### Adding New Events

Edit the `events` array in `src/App.jsx`:

```javascript
const events = [
  { id: 1, name: "Event Name", time: "Day Time", location: "Location" },
  // Add more events...
];
```

### Adding Directory Items

Edit the `directoryItems` array in `src/App.jsx`:

```javascript
const directoryItems = [
  { id: 1, name: "Category Name", count: 45, icon: "🏪" },
  // Add more categories...
];
```

## 📦 Dependencies

### Core
- React 19.1.0
- Mapbox GL JS 3.15.0
- Papa Parse 5.5.3 (CSV parsing)

### UI Components
- Tailwind CSS 4.x
- shadcn/ui components
- Lucide React (icons)
- Radix UI primitives

### Build Tools
- Vite 6.3.5
- pnpm 10.4.1

## 🌐 Deployment

### Option 1: Static Hosting (Recommended)

The built files in `dist/` can be deployed to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist/` folder
- **GitHub Pages**: Push to `gh-pages` branch
- **AWS S3**: Upload `dist/` contents to S3 bucket

### Option 2: Node.js Server

Serve the built files with a simple HTTP server:

```bash
npx serve dist
```

## 🔒 Environment Variables

If you need to use environment variables for sensitive data like API keys, create a `.env` file:

```env
VITE_MAPBOX_TOKEN=your-token-here
VITE_MAPBOX_STYLE=your-style-here
```

Then update `src/App.jsx` to use them:

```javascript
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE = import.meta.env.VITE_MAPBOX_STYLE;
```

## 📝 Development Notes

### Hot Module Replacement (HMR)

The development server supports HMR, so changes to your code will be reflected immediately without a full page reload.

### Code Splitting

For production optimization, consider implementing code splitting for the Mapbox library:

```javascript
const MapboxCentral = lazy(() => import('./components/MapboxCentral'));
```

### Performance

The current build includes a large JavaScript bundle (1.8 MB). For better performance:

1. Implement lazy loading for heavy components
2. Use dynamic imports for Mapbox GL JS
3. Consider using a CDN for Mapbox assets

## 🐛 Troubleshooting

### Map Not Loading

- Check that the Mapbox token is valid
- Verify the custom style URL is accessible
- Check browser console for errors

### CSV Data Not Loading

- Ensure `area_data.csv` is in the `public/` directory
- Check the CSV file format matches the expected structure
- Verify the file path in the `csvPath` variable

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
- Clear build cache: `rm -rf dist && pnpm run build`

## 📄 License

This project is created for the Stoneclough Initiative for Local & Autonomous Systems (SILAS).

## 🤝 Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For questions or support, please contact the SILAS team.

---

**Built with ❤️ for the Stoneclough Community**
