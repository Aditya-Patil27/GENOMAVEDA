const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'summaryAnnotations', 'summary_ann_evidence.tsv');
const destDir = path.join(process.cwd(), 'public', 'data');
const dest = path.join(destDir, 'summary_ann_evidence.tsv');

console.log(`Source: ${src}`);
console.log(`Destination: ${dest}`);

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('Created directory: public/data');
  }
  
  fs.copyFileSync(src, dest);
  console.log('File copied successfully!');
} catch (err) {
  console.error('Error copying file:', err);
  process.exit(1);
}
