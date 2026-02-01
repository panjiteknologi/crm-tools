const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, '../data/indonesia-provinsi-kota.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Remove duplicates for each province
const cleanedData = {};

for (const [provinsi, kotaData] of Object.entries(data)) {
  const uniqueKota = [...new Set(kotaData.kabupaten_kota)];
  cleanedData[provinsi] = {
    kabupaten_kota: uniqueKota
  };

  // Log if duplicates were removed
  // if (kotaData.kabupaten_kota.length !== uniqueKota.length) {
  //   console.log(`${provinsi}: ${kotaData.kabupaten_kota.length} -> ${uniqueKota.length} (removed ${kotaData.kabupaten_kota.length - uniqueKota.length} duplicates)`);
  // }
}

// Write the cleaned data back
fs.writeFileSync(jsonPath, JSON.stringify(cleanedData, null, 2));
// console.log('✅ Fixed duplicate kota in indonesia-provinsi-kota.json');
