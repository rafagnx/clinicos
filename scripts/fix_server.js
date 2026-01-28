
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../server/index.js');
let content = fs.readFileSync(filePath, 'utf8');

// The marker where the mess starts (inside requireAuth)
const startMarker = 'return next();';

// The marker where requireAuth ends (before cors middleware)
const endMarker = 'app.use(cors({';

const startIndex = content.lastIndexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

// The header of the new block (closing the if logic)
const newBlock = `
            }

            // Explicitly handle Supabase verification error
            if (error) {
                 console.error('[Auth] Supabase Error:', error.message);
                 return res.status(401).json({ 
                    error: "Unauthorized: Token Validation Failed", 
                    details: error.message,
                    hint: "Production Auth Debug Mode"
                 });
            }
            
        } catch (err) {
            console.error('[Auth] Exception:', err.message);
            return res.status(401).json({ 
                error: "Unauthorized: Server Error", 
                details: err.message 
            });
        }
    } else {
        console.warn("[Auth] No Bearer Token provided in header");
        return res.status(401).json({ error: "Unauthorized: No Token Provided", receivedHeaders: req.headers });
    }
    
    // Fallback?
    return res.status(401).json({ error: "Unauthorized: Invalid Session (Unknown)" });
};

// Middleware
`;

console.log(`Replacing content between index ${startIndex} and ${endIndex}`);

const newContent = content.substring(0, startIndex + startMarker.length) + newBlock + content.substring(endIndex);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Fixed server/index.js successfully');
