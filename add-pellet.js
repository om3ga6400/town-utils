const fs = require('fs');
let content = fs.readFileSync('data/weapon-data.js', 'utf8');

const lines = content.split('\n');
let result = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  
  // Check if this line has ammo: and the next line has reload_per_bullet
  if (line.trim().startsWith('ammo:') && i + 1 < lines.length && lines[i + 1].trim().startsWith('reload_per_bullet')) {
    // Check if pellet_count is already present in this weapon block
    let hasPelletCount = false;
    for (let j = Math.max(0, i - 20); j <= i; j++) {
      if (lines[j].includes('pellet_count')) {
        hasPelletCount = true;
        break;
      }
    }
    
    if (!hasPelletCount) {
      // Add pellet_count: 1, after ammo line
      result.push(line);
      result.push('    pellet_count: 1,');
    } else {
      result.push(line);
    }
  } else {
    result.push(line);
  }
  i++;
}

fs.writeFileSync('data/weapon-data.js', result.join('\n'));
console.log('Done!');
