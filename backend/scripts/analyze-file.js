const fs = require('fs');
const path = require('path');

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node analyze-file.js <path-to-image>');
  process.exit(1);
}

const fullPath = path.resolve(imagePath);
if (!fs.existsSync(fullPath)) {
  console.error(`File not found: ${fullPath}`);
  process.exit(1);
}

const base64Image = fs.readFileSync(fullPath, 'base64');
const startTime = Date.now();

fetch('http://127.0.0.1:3001/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64Image })
})
.then(async res => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Time elapsed: ${elapsed}s`);
  console.log(`Status: ${res.status}`);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
})
.catch(err => {
  console.error('Error:', err.message);
});
