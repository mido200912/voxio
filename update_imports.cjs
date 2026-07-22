const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if(file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const landingFiles = walk('frontend/src/components/landing');
const uiFiles = walk('frontend/src/components/ui');

[...landingFiles, ...uiFiles].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let orig = content;
  
  // Replace ../ with ../../ for contexts, hooks, assets, utils, etc.
  // Handle both single and double quotes
  content = content.replace(/from '(?:\.\.\/)+context\//g, "from '../../context/");
  content = content.replace(/from '(?:\.\.\/)+hooks\//g, "from '../../hooks/");
  content = content.replace(/from '(?:\.\.\/)+assets\//g, "from '../../assets/");
  content = content.replace(/from '(?:\.\.\/)+utils\//g, "from '../../utils/");
  content = content.replace(/src='(?:\.\.\/)+assets\//g, "src='../../assets/");
  
  content = content.replace(/from "(?:\.\.\/)+context\//g, 'from "../../context/');
  content = content.replace(/from "(?:\.\.\/)+hooks\//g, 'from "../../hooks/');
  content = content.replace(/from "(?:\.\.\/)+assets\//g, 'from "../../assets/');
  content = content.replace(/from "(?:\.\.\/)+utils\//g, 'from "../../utils/');
  content = content.replace(/src="(?:\.\.\/)+assets\//g, 'src="../../assets/');

  if(orig !== content) {
    fs.writeFileSync(f, content);
    console.log('Fixed relative paths in ' + f);
  }
});
