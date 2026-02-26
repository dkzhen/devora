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

    // Fix missing request parameter
    const regex = /export async function (GET|POST|PUT|DELETE|PATCH)\(\)\s*\{\s*trackApiHit\(request\);/g;
    if (regex.test(content)) {
        content = content.replace(regex, 'export async function $1(request) {\n    trackApiHit(request);');
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Fixed missing argument in:', filePath);
    }
});
