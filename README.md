# Captain's Log - Age of Exploration Diary Blog

A beautiful blog system that transforms GitHub Issues into a diary from the Age of Exploration, styled like ancient parchment scrolls.

## Features

- 📜 **Parchment Roll Design**: Authentic aged paper aesthetic with vintage typography
- ⚓ **Age of Exploration Theme**: Historical diary format reminiscent of captain's logs and explorer journals
- 🗺️ **GitHub Issues Integration**: Automatically fetches and displays issues from your repository
- 📱 **Responsive Design**: Works beautifully on all devices
- 🎨 **Beautiful Typography**: Classic serif fonts and historical formatting

## How to Use

1. **Deploy to GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select your branch (usually `main`) and save
   - Your blog will be live at `https://[username].github.io/[repository]`

2. **Create Blog Posts**:
   - Create new GitHub Issues in your repository
   - The issue title becomes the entry title
   - The issue body becomes the entry content
   - Labels are displayed as categories
   - Issues are automatically displayed in chronological order

3. **Customize**:
   - Edit `style.css` to adjust colors and styling
   - Modify `script.js` to change the repository source or formatting
   - Update `index.html` to change the header text

## Local Development

Simply open `index.html` in a web browser to see the blog in action. The JavaScript will fetch issues from the GitHub API.

## Theme Details

The design captures the spirit of the Age of Exploration (15th-17th century) with:
- Warm parchment tones and textures
- Aged paper effects with subtle shadows
- Classical serif typography
- Historical date formatting
- Nautical imagery and terminology

## Example

Create an issue with:
- **Title**: "Discovery of the New World"
- **Body**: "Today we made landfall on uncharted shores..."
- **Labels**: exploration, discovery

It will appear as a beautifully formatted diary entry with the date styled as "The 17th day of January, Year 2026".