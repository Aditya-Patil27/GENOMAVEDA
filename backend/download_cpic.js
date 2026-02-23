const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://api.cpicpgx.org/v1/recommendation?limit=10000';
const outputPath = path.join(__dirname, 'data', 'cpic_recommendations.json');

console.log(`Fetching CPIC recommendations from ${url}...`);

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log(`Successfully fetched ${json.length} recommendations.`);
        fs.writeFileSync(outputPath, JSON.stringify(json, null, 2));
        console.log(`Saved to ${outputPath}`);
      } catch (e) {
        console.error('Error parsing JSON:', e.message);
      }
    } else {
      console.error(`Failed to fetch. Status code: ${res.statusCode}`);
    }
  });

}).on('error', (err) => {
  console.error('Error: ' + err.message);
});
