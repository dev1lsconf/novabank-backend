const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'netlify', 'functions');
const destDir = path.join(__dirname, '..', 'dist', 'netlify', 'functions');

if (!fs.existsSync(srcDir)) {
  console.error('Source functions directory not found:', srcDir);
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

copyRecursive(srcDir, destDir);
console.log('Netlify functions copied successfully!');