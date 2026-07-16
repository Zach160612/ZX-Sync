const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_DATA = {
  'warnings.json': {},
  'events.json': [],
  'tickets.json': {},
  'giveaways.json': [],
};

// Initialize missing files with defaults
for (const [file, defaultValue] of Object.entries(DEFAULT_DATA)) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

/**
 * Read JSON data from a file in the data directory.
 * @param {string} filename - e.g. 'warnings.json'
 * @returns {any}
 */
function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    const defaultVal = DEFAULT_DATA[filename];
    return defaultVal !== undefined ? defaultVal : null;
  }
}

/**
 * Write JSON data to a file in the data directory.
 * @param {string} filename - e.g. 'warnings.json'
 * @param {any} data
 */
function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData };
