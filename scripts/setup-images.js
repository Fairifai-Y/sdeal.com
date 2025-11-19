const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const createDirectories = () => {
  const dirs = [
    'src/assets/images',
    'public/images'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Copy images from original location to React app
const copyImages = () => {
  const originalImagesDir = 'images';
  const reactImagesDir = 'public/images';
  const assetsImagesDir = 'src/assets/images';
  
  if (!fs.existsSync(originalImagesDir)) {
    console.log('Original images directory not found. Please ensure images are in the root images/ folder.');
    return;
  }
  
  // Check if destination directory exists and has files (skip if already set up)
  if (fs.existsSync(reactImagesDir)) {
    const existingImages = fs.readdirSync(reactImagesDir).filter(f => f.match(/\.(png|jpg|jpeg|gif|svg)$/i));
    if (existingImages.length > 0) {
      console.log(`Images already exist in ${reactImagesDir} (${existingImages.length} files). Skipping copy.`);
      return;
    }
  }
  
  const images = fs.readdirSync(originalImagesDir);
  let copiedCount = 0;
  
  images.forEach(image => {
    if (image.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
      // Copy to public/images for static serving
      const sourcePath = path.join(originalImagesDir, image);
      const destPath = path.join(reactImagesDir, image);
      
      // Skip if already exists
      if (fs.existsSync(destPath)) {
        return;
      }
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
        console.log(`Copied ${image} to public/images/`);
      } catch (err) {
        console.error(`Error copying ${image}:`, err.message);
      }
      
      // Copy logo to assets for import
      if (image.toLowerCase().includes('logo')) {
        const assetsDestPath = path.join(assetsImagesDir, image);
        if (!fs.existsSync(assetsDestPath)) {
          try {
            fs.copyFileSync(sourcePath, assetsDestPath);
            console.log(`Copied ${image} to src/assets/images/`);
          } catch (err) {
            console.error(`Error copying ${image} to assets:`, err.message);
          }
        }
      }
    }
  });
  
  if (copiedCount === 0) {
    console.log('No new images to copy. All images are already in place.');
  }
};

// Main execution
console.log('Setting up images for React app...');
createDirectories();
copyImages();
console.log('Image setup complete!'); 