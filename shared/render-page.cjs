const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function renderPage(source, page) {
  const rendered = source.replace('<!-- component:navbar -->', () => {
    const navbar = fs.readFileSync(path.join(root, 'components/navbar.html'), 'utf8');
    return navbar.replace(/<a href="([^"]+)"/g, (link, href) =>
      href === (path.basename(page) === 'project.html' ? 'projects.html' : path.basename(page)) ? `${link} aria-current="page"` : link,
    );
  });
  const bootstrap = "<script data-theme-init>(function(){var r=document.documentElement,t;try{t=localStorage.getItem('portfolio-theme')}catch(e){}if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';r.dataset.theme=t;r.style.colorScheme=t;r.style.backgroundColor=t==='dark'?'#091526':'#edf6ff';var m=document.querySelector('meta[name=\\\"theme-color\\\"]');if(m)m.content=t==='dark'?'#091526':'#edf6ff'})();</script>";
  return /<meta\s+name="theme-color"[^>]*>/i.test(rendered)
    ? rendered.replace(/(<meta\s+name="theme-color"[^>]*>)/i, '$1' + bootstrap)
    : rendered.replace(/<head([^>]*)>/i, '<head$1>' + bootstrap);
}

module.exports = { renderPage };
