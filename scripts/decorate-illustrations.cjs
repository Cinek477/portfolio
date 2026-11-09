// Dodaje dekoracje tła ilustracji projektów: dwie miękkie plamy, pierścień i kropki.
// Elementy mają data-tone (blob/accent), dzięki czemu make-dark-illustrations.cjs zamienia je
// na ciemne pastele jaśniejsze od tła karty. Skrypt jest idempotentny: podmienia poprzednią grupę.
// Po uruchomieniu wygeneruj ciemne warianty: node scripts/make-dark-illustrations.cjs
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
  h = (h + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map(value => Math.round((value + m) * 255).toString(16).padStart(2, '0')).join('');
}
// Kolory pochodne od tła: jaśniejsza plama, plama w sąsiednim odcieniu i ciemniejsze akcenty.
function palette(background) {
  const [h, s, l] = toHsl(background);
  return {
    light: toHex(h, Math.min(1, s + 0.1), Math.min(0.95, l + 0.1)),
    neighbour: toHex(h + 38, Math.min(1, s + 0.05), l),
    accent: toHex(h, Math.min(1, s * 0.85 + 0.12), l * 0.62),
  };
}
// Układ: [top, bottom] widocznej części viewBox; okno projektu zajmuje środek.
const layouts = {
  oop: { background: '#c6a2de', top: 160, bottom: 900 },
  database: { background: '#acd8d7', top: 160, bottom: 900 },
  matura: { background: '#b6d7f4', top: 160, bottom: 900 },
  hackyeah: { background: '#c6d6f5', top: 0, bottom: 740 },
  krakhack: { background: '#b9e1e6', top: 0, bottom: 740 },
};
function decor({ background, top, bottom }) {
  const { light, neighbour, accent } = palette(background);
  const height = bottom - top, y = fraction => Math.round(top + height * fraction);
  const dots = [];
  for (let row = 0; row < 3; row++) for (let column = 0; column < 4; column++) {
    dots.push(`<circle data-tone="accent" cx="${46 + column * 18}" cy="${y(0.36) + row * 18}" r="3.2" fill="${accent}" opacity=".55"/>`);
  }
  // Miękkie plamy to koła z gradientem radialnym o profilu rozmytego koła (promień 120, rozmycie ~34).
  // Filtr feGaussianBlur dawał ten sam efekt, ale przeliczanie go przy wczytaniu pięciu grafik
  // powodowało ścinkę przy wejściu na Projekty. Plama musi zmieścić się w grafice (inaczej ją ucina).
  const blobRadius = 120, blur = 34, glowRadius = blobRadius + blur * 2, blobMargin = blobRadius + blur * 3 + 6;
  const glow = (id, color) => `<radialGradient id="${id}">`
    + `<stop data-tone="blob" offset="0" stop-color="${color}"/>`
    + `<stop data-tone="blob" offset=".28" stop-color="${color}"/>`
    + `<stop data-tone="blob" offset=".46" stop-color="${color}" stop-opacity=".84"/>`
    + `<stop data-tone="blob" offset=".64" stop-color="${color}" stop-opacity=".5"/>`
    + `<stop data-tone="blob" offset=".82" stop-color="${color}" stop-opacity=".16"/>`
    + `<stop data-tone="blob" offset="1" stop-color="${color}" stop-opacity="0"/>`
    + `</radialGradient>`;
  return `<g data-decor="">
<defs>${glow('decor-glow-a', light)}${glow('decor-glow-b', neighbour)}</defs>
<circle cx="${1200 - blobMargin}" cy="${top + blobMargin}" r="${glowRadius}" fill="url(#decor-glow-a)" opacity=".85"/>
<circle cx="${blobMargin}" cy="${bottom - blobMargin}" r="${glowRadius}" fill="url(#decor-glow-b)" opacity=".7"/>
<circle data-tone="accent" cx="1108" cy="${y(0.8)}" r="44" fill="none" stroke="${accent}" stroke-width="3" opacity=".45"/>
<circle data-tone="accent" cx="1108" cy="${y(0.8)}" r="7" fill="${accent}" opacity=".5"/>
${dots.join('\n')}
<circle data-tone="accent" cx="1150" cy="${y(0.42)}" r="5" fill="${accent}" opacity=".5"/>
<circle data-tone="accent" cx="1172" cy="${y(0.5)}" r="3" fill="${accent}" opacity=".45"/>
<circle data-tone="accent" cx="60" cy="${y(0.7)}" r="4" fill="${accent}" opacity=".45"/>
<circle data-tone="accent" cx="560" cy="${y(0.06)}" r="4" fill="${accent}" opacity=".4"/>
<circle data-tone="accent" cx="760" cy="${y(0.04)}" r="3" fill="${accent}" opacity=".35"/>
</g>
`;
}
for (const [name, layout] of Object.entries(layouts)) {
  const file = path.join(directory, name + '.svg');
  // Dekoracja stoi zawsze tuż przed grupą okna, więc usuwamy wszystko od jej początku do tej grupy
  // (sama grupa ma zagnieżdżone </g>, więc nie można szukać pierwszego zamknięcia).
  const source = fs.readFileSync(file, 'utf8').replace(/<g data-decor="">[\s\S]*?(?=<g filter="url\(#shadow\)">)/, '');
  const split = source.indexOf('<g filter="url(#shadow)">');
  if (split < 0) throw new Error('Nie znaleziono grupy z cieniem w ' + name);
  fs.writeFileSync(file, source.slice(0, split) + decor(layout) + source.slice(split));
  console.log(name + '.svg');
}
