import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const excludeDirs = ['.git', 'node_modules', 'dist', '.gemini', 'artifacts'];

function replaceInFile(filePath) {
    if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.gif') || filePath.endsWith('.ico')) return;
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;
        
        // Patterns
        content = content.replace(/VOXIO/g, 'VOXIO');
        content = content.replace(/voxio/g, 'voxio');
        content = content.replace(/VOXIO/g, 'VOXIO');
        content = content.replace(/VOXIO/g, 'VOXIO');
        
        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            // console.log(`Replaced in: ${filePath}`);
        }
    } catch (e) {
        // Silently skip binary files or errors
    }
}

function rebrand(dir) {
    const items = fs.readdirSync(dir);
    
    // First, process files in this directory
    for (const item of items) {
        let fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!excludeDirs.includes(item)) {
                rebrand(fullPath);
            }
        } else {
            replaceInFile(fullPath);
        }
    }
    
    // Then, rename items in this directory (bottom-up)
    const itemsAfter = fs.readdirSync(dir);
    for (const item of itemsAfter) {
        let fullPath = path.join(dir, item);
        
        if (item.toLowerCase().includes('voxio')) {
            const newName = item.replace(/voxio/gi, 'VOXIO');
            const newPath = path.join(dir, newName);
            fs.renameSync(fullPath, newPath);
            console.log(`Renamed: ${fullPath} -> ${newPath}`);
        }
    }
}

console.log('Starting global rebrand (Content + Filenames) to VOXIO...');
rebrand(rootDir);
console.log('Rebrand completed!');
