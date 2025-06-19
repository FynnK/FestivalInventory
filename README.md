# Festival Inventory Management System

A modern, React-based inventory management system designed for festival and event management. This application provides comprehensive tools for tracking equipment, managing stage assignments, and generating reports.

## Features

### 🎯 Core Functionality
- **Barcode Scanning**: Support for both manual entry and camera-based QR code scanning
- **Real-time Inventory Tracking**: Track total quantities, available stock, and stage assignments
- **Stage Management**: Create and manage multiple stages/locations
- **Transaction Processing**: Assign items to stages with detailed transaction records
- **Import Mode**: Quickly add new inventory items by scanning

### 📊 Reporting & Data Management
- **Excel Export**: Export inventory data to Excel spreadsheets
- **JSON Backup**: Save and load complete system data
- **Usage Analytics**: Track item usage across different stages
- **Real-time Updates**: Automatic localStorage persistence

### 🎨 User Experience
- **Dark Theme**: Professional dark UI optimized for low-light environments
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Glass Morphism**: Modern glass-card design elements
- **Toast Notifications**: Real-time feedback for all operations
- **Modal Dialogs**: Intuitive confirmation and input dialogs

## Technology Stack

- **Frontend**: React 19.1.0 with modern hooks
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React icon library
- **QR Scanning**: html5-qrcode library
- **Excel Export**: xlsx library
- **Build Tool**: Vite for fast development and building
- **Package Manager**: pnpm for efficient dependency management

## Installation & Setup

### Prerequisites
- Node.js 20.18.0 or higher
- pnpm (recommended) or npm

### Quick Start
```bash
# Clone or extract the project
cd festival-inventory

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Development Server
The development server runs on `http://localhost:5173` with hot reload enabled.

## Usage Guide

### Getting Started
1. **Add Stages**: Navigate to the Stages tab and create your event locations
2. **Add Inventory**: Use the "Add New Item" button or scan items in Import Mode
3. **Process Transactions**: Scan items and assign them to stages
4. **Monitor Usage**: View real-time inventory levels and stage assignments

### Scanning Items
- **Manual Entry**: Type or paste barcode IDs directly
- **Camera Scanning**: Click the camera button to use QR code scanning
- **Import Mode**: Toggle to add new items directly to inventory

### Transaction Workflow
1. Scan or enter item barcodes
2. Select target stage from dropdown
3. Review items in transaction
4. Confirm to assign items to the stage

### Data Management
- **Export**: Generate Excel reports or JSON backups
- **Import**: Load previously saved JSON data
- **Persistence**: All data automatically saves to browser localStorage

## Project Structure

```
festival-inventory/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── App.jsx           # Main application component
│   ├── App.css           # Global styles and theme
│   ├── index.css         # Base styles
│   └── main.jsx          # Application entry point
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

## Key Improvements Over Original

### Code Organization
- **Component Architecture**: Modular React components instead of monolithic HTML
- **Separation of Concerns**: Distinct files for styles, logic, and components
- **Modern JavaScript**: ES6+ features, hooks, and functional components

### Development Experience
- **Hot Reload**: Instant updates during development
- **TypeScript Ready**: Easy migration path to TypeScript
- **Modern Tooling**: Vite for fast builds and development
- **Package Management**: Proper dependency management with pnpm

### Performance & Maintainability
- **Tree Shaking**: Automatic removal of unused code
- **Code Splitting**: Optimized bundle sizes
- **Modern CSS**: Tailwind CSS for consistent styling
- **Error Handling**: Improved error boundaries and user feedback

### User Experience
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Accessibility**: Better keyboard navigation and screen reader support
- **Loading States**: Proper feedback for async operations
- **Data Persistence**: Reliable localStorage with error handling

## Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Camera Features**: Requires HTTPS in production for camera access

## Security Considerations

- **HTTPS Required**: Camera scanning requires secure context
- **Local Storage**: Data stored locally in browser (no server transmission)
- **Input Validation**: Proper validation for all user inputs
- **XSS Protection**: React's built-in XSS protection

## Deployment Options

### Static Hosting
- Vercel, Netlify, GitHub Pages
- Build with `pnpm run build` and deploy the `dist` folder

### Self-Hosted
- Any web server capable of serving static files
- Nginx, Apache, or similar

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "run", "preview", "--host"]
```

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use Prettier for formatting
- Follow React best practices
- Write descriptive commit messages
- Add comments for complex logic

## Troubleshooting

### Common Issues

**Camera not working**
- Ensure HTTPS connection in production
- Check browser permissions for camera access
- Verify camera is not in use by another application

**Data not persisting**
- Check browser localStorage quota
- Ensure JavaScript is enabled
- Clear browser cache if issues persist

**Performance issues**
- Check for large inventory datasets
- Consider pagination for 1000+ items
- Monitor browser memory usage

### Support
For technical support or feature requests, please check the project documentation or create an issue in the repository.

## License

This project is provided as-is for educational and commercial use. Please ensure compliance with all third-party library licenses.

---

**Built with ❤️ for the festival and event management community**


<p align="center">
  <a href="https://www.buymeacoffee.com/nonagonal" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
</p>

