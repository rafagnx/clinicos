import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, 'index.js');
let content = fs.readFileSync(file, 'utf8');

// Inject logging
const search = 'const query = `INSERT INTO "${tableName}"';
const replace = 'console.log("[SQL DEBUG] Query:", `INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(\', \')}) VALUES(${placeholders}) RETURNING *`);\n        const query = `INSERT INTO "${tableName}"';

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log("Logged INSERT query.");
} else {
    console.log("Search string not found.");
}
