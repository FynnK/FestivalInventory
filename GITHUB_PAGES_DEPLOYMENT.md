# GitHub Pages Deployment Guide

This guide will walk you through deploying your Festival Inventory Management application to GitHub Pages for free hosting.

## Prerequisites

- A GitHub account
- Git installed on your computer
- The festival-inventory project files

## Step 1: Prepare Your Project

### 1.1 Update Vite Configuration

First, you need to configure Vite for GitHub Pages deployment. Update your `vite.config.js` file:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/festival-inventory/', // Replace with your repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

**Important**: Replace `festival-inventory` with your actual GitHub repository name.

### 1.2 Add Deployment Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "predeploy": "pnpm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### 1.3 Install GitHub Pages Deployment Tool

```bash
pnpm add -D gh-pages
```

## Step 2: Create GitHub Repository

### 2.1 Create New Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., `festival-inventory`)
5. Make sure it's set to **Public** (required for free GitHub Pages)
6. Don't initialize with README, .gitignore, or license (we'll add these)
7. Click "Create repository"

### 2.2 Initialize Git in Your Project

In your project directory, run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Festival Inventory Management System"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/festival-inventory.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Configure GitHub Pages

### 3.1 Enable GitHub Pages
1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Choose "gh-pages" branch and "/ (root)" folder
6. Click "Save"

### 3.2 Deploy Your Application

Run the deployment command:

```bash
pnpm run deploy
```

This will:
1. Build your application for production
2. Create a `gh-pages` branch
3. Push the built files to GitHub Pages

## Step 4: Access Your Deployed Application

After deployment (usually takes 5-10 minutes), your application will be available at:

```
https://YOUR_USERNAME.github.io/festival-inventory/
```

Replace `YOUR_USERNAME` with your GitHub username and `festival-inventory` with your repository name.

## Step 5: Set Up Automatic Deployment (Optional)

### 5.1 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build
      run: pnpm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

This will automatically deploy your application whenever you push changes to the main branch.

## Troubleshooting

### Common Issues and Solutions

**1. 404 Error on Deployment**
- Check that the `base` in `vite.config.js` matches your repository name
- Ensure GitHub Pages is configured to use the `gh-pages` branch

**2. Assets Not Loading**
- Verify the `base` configuration in `vite.config.js`
- Check that all asset paths are relative

**3. Camera Scanning Not Working**
- GitHub Pages serves over HTTPS, so camera features should work
- If issues persist, check browser permissions

**4. Build Fails**
- Run `pnpm run build` locally to check for errors
- Ensure all dependencies are properly installed

### Manual Deployment Alternative

If automatic deployment doesn't work, you can manually deploy:

```bash
# Build the project
pnpm run build

# Navigate to the dist folder
cd dist

# Initialize git and push to gh-pages branch
git init
git add .
git commit -m "Deploy to GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/YOUR_USERNAME/festival-inventory.git
git push -f origin gh-pages
```

## Updating Your Deployment

To update your deployed application:

1. Make changes to your code
2. Commit and push to the main branch:
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```
3. Deploy the changes:
   ```bash
   pnpm run deploy
   ```

## Custom Domain (Optional)

If you have a custom domain:

1. Add a `CNAME` file to your `public` folder with your domain name
2. Configure your domain's DNS to point to GitHub Pages
3. Update the GitHub Pages settings to use your custom domain

## Security Considerations

- **HTTPS**: GitHub Pages automatically provides HTTPS
- **Data Storage**: All data is stored locally in the browser
- **Camera Access**: Requires user permission and HTTPS (provided by GitHub Pages)

## Performance Tips

- The application is optimized for production builds
- Assets are automatically minified and compressed
- Consider enabling browser caching for better performance

## Support

If you encounter issues:
1. Check the GitHub Pages documentation
2. Verify your `vite.config.js` configuration
3. Test the build locally with `pnpm run build && pnpm run preview`
4. Check the GitHub Actions logs if using automatic deployment

---

**Congratulations!** Your Festival Inventory Management system is now deployed and accessible worldwide through GitHub Pages.

