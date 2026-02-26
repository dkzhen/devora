const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/app/api');

// Function to recursively find all route.js files
function findRoutes(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findRoutes(filePath, fileList);
        } else if (file === 'route.js') {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const routes = findRoutes(srcDir);

routes.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip monitoring endpoint itself
    if (filePath.includes('api/monitoring/route.js')) return;

    // Check if trackApiHit is already imported
    if (!content.includes('trackApiHit')) {
        // Find existing imports block and append trackApiHit
        const importMatch = content.match(/import .*?;?(\r?\n)/);
        if (importMatch) {
            content = content.replace(
                importMatch[0],
                `import { trackApiHit } from '@/lib/monitoring';\n${importMatch[0]}`
            );
        } else {
            content = `import { trackApiHit } from '@/lib/monitoring';\n\n` + content;
        }

        // Regex to find export async function GET, POST, PUT, DELETE, PATCH and insert trackApiHit
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        methods.forEach(method => {
            const regex = new RegExp(`export async function ${method}\\(([^\\)]*)\\)\\s*{`, 'g');
            content = content.replace(regex, (match, args) => {
                // Determine req variable name (usually request, req, etc.)
                const reqVar = args.split(',')[0].trim() || 'request';
                // Calculate string
                return `export async function ${method}(${args}) {\n    trackApiHit(${reqVar});`;
            });
        });

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Injected into:', filePath);
    }
});

console.log('Done injecting monitoring tracking.');
