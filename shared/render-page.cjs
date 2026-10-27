const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function renderPage(source, page) {
  return source.replace('<!-- component:navbar -->', () => {
    const navbar = fs.readFileSync(path.join(root, 'components/navbar.html'), 'utf8');
    return navbar.replace(/<a href="([^"]+)"/g, (link, href) =>
      href === (path.basename(page) === 'project.html' ? 'projects.html' : path.basename(page)) ? `${link} aria-current="page"` : link,
    );
  });
}

module.exports = { renderPage };
