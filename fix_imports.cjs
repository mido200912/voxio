const fs = require('fs');
const path = require('path');

const directoryToSearch = path.join(__dirname, 'backend');

function replaceInFile(filePath) {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace imports of Company.js
        if (content.includes('models/Company.js')) {
            content = content.replace(/models\/Company\.js/g, 'models/CompanyModel.js');
            modified = true;
        }
        
        // Also replace models/company.js just in case
        if (content.includes('models/company.js')) {
            content = content.replace(/models\/company\.js/g, 'models/CompanyModel.js');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
    }
}

function processDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules') {
                processDirectory(fullPath);
            }
        } else {
            replaceInFile(fullPath);
        }
    });
}

processDirectory(directoryToSearch);
console.log('Done!');
