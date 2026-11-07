// Tworzy ciemne warianty ilustracji projektów (*-dark.svg): zmienia tylko tło i plamy dekoracyjne.
// Kolor = ten sam odcień, nasycenie ×0,9, jasność ×0,3 — dokładnie jak CSS
// hsl(from <kolor> h calc(s * 0.9) calc(l * 0.3)) dla kart w ciemnym motywie, więc nie widać szwu.
// Uruchom ponownie po zmianie którejkolwiek ilustracji: node scripts/make-dark-illustrations.cjs
const fs = require('node:fs');
const path = require('node:path');

const directory = path.join(__dirname, '..', 'assets/images/projects/illustrations');
function toHsl(hex) {
  const [r, g, b] = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, s, l];
}
function toHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map(value => Math.round((value + m) * 255).toString(16).padStart(2, '0')).join('');
}
function dark(hex, lightness = 0.3, maxSaturation = 1) {
  const [h, s, l] = toHsl(hex);
  return toHex(h, Math.min(s * 0.9, maxSaturation), l * lightness);
}
// Hackathony mają pastelowe okno (nie białą „kartkę” jak OOP/bazy/matura), które na ciemnej karcie
// raziło. Okno jest odrobinę jaśniejsze od tła karty, ramka i boczne bloki podium jeszcze jaśniejsze,
// a złota nagroda, paski tytułowe i loga zostają bez zmian. Nasycenie okna jest ograniczone do 40%,
// bo bardzo jasne pastele mają prawie 100% nasycenia i po przyciemnieniu robiły się krzykliwe.
const windowParts = {
  hackyeah: [
    ['stop-color="#dce9ff"', 0.38], ['stop-color="#b8c6ed"', 0.38],
    ['stroke="#edf5ff"', 0.5], ['fill="#a4b5e3"', 0.62], ['fill="#acbde9"', 0.62],
  ],
  krakhack: [
    ['fill="#d5edf0"', 0.38], ['stroke="#eefcfc"', 0.5], ['fill="#ecf8fa"', 0.5],
  ],
};
const lightText = { krakhack: [['fill="#527b8c"', 'fill="#a9d3dc"']] };
function darkenWindow(name, source) {
  for (const [attribute, lightness] of windowParts[name] || []) {
    const color = attribute.match(/#[0-9a-f]{6}/i)[0];
    if (!source.includes(attribute)) throw new Error(name + ': brak ' + attribute);
    source = source.split(attribute).join(attribute.replace(color, dark(color, lightness, 0.4)));
  }
  for (const [from, to] of lightText[name] || []) {
    if (!source.includes(from)) throw new Error(name + ': brak ' + from);
    source = source.split(from).join(to);
  }
  return source;
}
// Tło i plamy leżą przed pierwszą grupą z cieniem; dalsze elementy (okno, nagroda) zostają jasne.
for (const name of ['oop', 'database', 'matura', 'hackyeah', 'krakhack']) {
  const source = fs.readFileSync(path.join(directory, name + '.svg'), 'utf8');
  const split = source.indexOf('<g filter="url(#shadow)">');
  if (split < 0) throw new Error('Nie znaleziono grupy z cieniem w ' + name);
  // Dekoracje (scripts/decorate-illustrations.cjs) mają data-tone: plamy stają się ciemnym pastelem
  // jaśniejszym od tła, a kropki i pierścień jasnym, stonowanym pastelem, by były widoczne na ciemnym tle.
  const tone = (kind, color) => {
    if (kind === 'blob') return dark(color, 0.42, 0.55);
    const [h, s] = toHsl(color);
    return toHex(h, Math.min(s * 0.9, 0.45), 0.66);
  };
  const background = source.slice(0, split).replace(
    /<(?:rect|circle)\b[^>]*>/gi,
    element => {
      const kind = element.match(/\bdata-tone="(\w+)"/)?.[1];
      if (kind) return element.replace(/#[0-9a-f]{6}/gi, color => tone(kind, color));
      return element.replace(/(\bfill=")(#[0-9a-f]{6})(")/i, (all, start, color, end) => start + dark(color) + end);
    },
  );
  fs.writeFileSync(path.join(directory, name + '-dark.svg'), darkenWindow(name, background + source.slice(split)));
  console.log(name + '-dark.svg');
}
