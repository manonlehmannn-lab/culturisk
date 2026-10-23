// Identité graphique : le « C » de Culturisk, formé des 10 segments de thèmes autour d'un buzzer lumineux.

import { CATEGORIES } from '../engine/categories.js';

const pt = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)].map((n) => n.toFixed(2)).join(' ');
};

// Anneau en C : 10 arcs colorés, ouverture à droite (comme une jauge de 10 niveaux).
export function ringSegments({ cx = 100, cy = 100, r = 74, width = 22, from = 38, to = 322, gap = 5, cls = 'ring-seg' } = {}) {
  const span = (to - from) / CATEGORIES.length;
  return CATEGORIES.map((c, i) => {
    // Le premier thème en haut, puis sens antihoraire vers le bas.
    const a1 = to - i * span - gap / 2;
    const a2 = to - (i + 1) * span + gap / 2;
    return `<path class="${cls}" style="--i:${i};--c:${c.couleur}" d="M ${pt(cx, cy, r, a1)} A ${r} ${r} 0 0 1 ${pt(cx, cy, r, a2)}" stroke="${c.couleur}" stroke-width="${width}" fill="none"/>`;
  }).join('');
}

export function logoMark({ size = 200, animated = true } = {}) {
  return `<svg class="logo-mark${animated ? ' is-animated' : ''}" viewBox="0 0 200 200" width="${size}" height="${size}" aria-hidden="true">
    <defs>
      <radialGradient id="lm-buzz" cx="42%" cy="36%" r="70%">
        <stop offset="0" stop-color="#fff7d6"/>
        <stop offset=".45" stop-color="#ffd25a"/>
        <stop offset="1" stop-color="#f08a1c"/>
      </radialGradient>
      <radialGradient id="lm-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ffcf5a" stop-opacity=".55"/>
        <stop offset="1" stop-color="#ffcf5a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="62" fill="url(#lm-halo)"/>
    ${ringSegments()}
    <circle cx="100" cy="100" r="40" fill="#0d0b2e"/>
    <circle cx="100" cy="100" r="33" fill="url(#lm-buzz)"/>
    <ellipse cx="91" cy="88" rx="15" ry="8" fill="#fff" opacity=".55"/>
  </svg>`;
}

export function wordmark() {
  return `<h1 class="wordmark" aria-label="Culturisk"><span>CULTU</span><span class="wm-risk">RISK</span></h1>`;
}
