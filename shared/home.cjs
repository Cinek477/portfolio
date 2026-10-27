const { pageDefaults, normalizeContent } = require('./page-content.cjs');
const defaults = { ...require('./home-defaults.json'), content: pageDefaults.home };
function hydrateHome(saved) {
  if (saved.content) return { ...saved, currentWork: saved.currentWork || structuredClone(defaults.currentWork) };
  const content = structuredClone(pageDefaults.home);
  const hrefs = { projects: '#featured-projects', cv: 'assets/CV%20-%20STUDIO.pdf', contact: 'contact.html' };
  content.buttons = ['primary', 'secondary'].map(key => {
    const button = saved[key] || defaults[key];
    return { label: { pl: button.pl, en: button.en }, href: hrefs[button.target], visible: true, download: button.target === 'cv' };
  });
  return { ...saved, content, currentWork: saved.currentWork || structuredClone(defaults.currentWork) };
}
function normalizeHome(input, old = defaults) {
  const fail = () => { throw Object.assign(new Error('Sprawdź opis, przyciski i wybór kafelków Start.'), { status: 400 }); };
  const text = (value, max) => {
    if (typeof value !== 'string' || !value.trim() || value.length > max) fail();
    return value.trim();
  };
  const button = value => {
    if (!value || !['projects', 'cv', 'contact'].includes(value.target)) fail();
    return { target: value.target, pl: text(value.pl, 80), en: text(value.en, 80) };
  };
  if (!input?.bio || !Array.isArray(input.featured) || input.featured.length > 3 ||
      input.featured.some(id => typeof id !== 'string' || !/^[\w-]{1,100}$/.test(id)) ||
      new Set(input.featured).size !== input.featured.length) fail();
  const work=input.currentWork ?? old.currentWork ?? defaults.currentWork;
  if(!work || typeof work.visible !== 'boolean') fail();
  const currentWork={visible:work.visible,title:{pl:text(work.title?.pl,120),en:text(work.title?.en||work.title?.pl,120)},text:{pl:text(work.text?.pl,1000),en:text(work.text?.en||work.text?.pl,1000)}};
  return { currentWork, bio: { pl: text(input.bio.pl, 2000), en: text(input.bio.en, 2000) },
    primary: button(input.primary), secondary: button(input.secondary), featured: input.featured,
    content: input.content ? normalizeContent(input.content, old.content || pageDefaults.home) : old.content || pageDefaults.home };
}
module.exports = { defaults, normalizeHome, hydrateHome };
