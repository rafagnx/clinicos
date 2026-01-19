import { Client } from 'basic-ftp';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function deploy() {
    const client = new Client();
    // client.ftp.verbose = true;

    try {
        console.log("=== AUTOMATED DEPLOYMENT TOOL ===");
        console.log("This will upload your 'dist' folder to 'htdocs' on ProFreeHost.");

        // 1. Get Credentials
        const host = await new Promise(resolve => rl.question('FTP Host (e.g. ftpupload.net): ', resolve)) || "ftpupload.net";
        const user = await new Promise(resolve => rl.question('FTP Username (unaux_...): ', resolve));
        const password = await new Promise(resolve => rl.question('FTP Password: ', resolve));

        if (!user || !password) {
            console.error("Error: Username and Password are required.");
            return;
        }

        console.log("\nConnecting to FTP...");
        await client.access({
            host: host,
            user: user,
            password: password,
            secure: false // ProFreeHost usually uses plain FTP or older TLS
        });

        console.log("Connected! Cleaning remote 'htdocs' folder...");
        await client.clearWorkingDir("htdocs");

        console.log("Uploading new files from 'dist'...");
        await client.uploadFromDir(path.join(__dirname, "../dist"), "htdocs");

        console.log("\nSUCCESS! Deployment Complete.");
        console.log("Visit https://clinicos.unaux.com/ in your browser.");

    } catch (err) {
        console.error("Deployment Failed:", err);
    } finally {
        client.close();
        rl.close();
    }
}

deploy();
