/* Графічні елементи гри «Мишоловки». Миша — з файлу mouse.png (копія з
   оригінальної гри), решта ілюстрацій — вбудовані SVG. */
window.G = (function () {
  'use strict';

  function mouse(width) {
    // Висота не фіксується: зображення завжди зберігає свої природні пропорції,
    // незалежно від того, який файл mouse.png зараз використовується.
    return '<img class="gfx-mouse" src="mouse.png" width="' + width + '" alt="Мишо-мишка">';
  }

  function cheese(size) {
    return `<svg class="gfx-cheese" width="${size}" height="${size}" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 74 L88 74 L88 40 L6 40 Z" fill="#f59e0b"/>
      <path d="M6 40 L88 40 L46 14 Z" fill="#fbbf24"/>
      <path d="M6 74 L88 74 L88 66 L6 66 Z" fill="#d97706"/>
      <circle cx="30" cy="52" r="5" fill="#d97706"/><circle cx="55" cy="46" r="4" fill="#d97706"/>
      <circle cx="72" cy="58" r="6" fill="#d97706"/><circle cx="45" cy="64" r="3.5" fill="#d97706"/>
      <circle cx="64" cy="30" r="4" fill="#f59e0b"/><circle cx="44" cy="30" r="3" fill="#f59e0b"/>
    </svg>`;
  }

  function star(size, color) {
    color = color || '#fbbf24';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" fill="${color}" stroke="#b45309" stroke-width="1" stroke-linejoin="round"/>
    </svg>`;
  }

  function firecracker(size) {
    return `<svg class="gfx-firecracker" width="${size}" height="${size}" viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="27" y="30" width="26" height="58" rx="7" fill="#ef4444" stroke="#991b1b" stroke-width="3"/>
      <path d="M27 44 H53 M27 62 H53" stroke="#fca5a5" stroke-width="4"/>
      <path d="M40 30 Q34 18 42 10 Q40 20 48 24 Q42 26 40 30" fill="#fde047" stroke="#f59e0b" stroke-width="2"/>
      <circle cx="40" cy="24" r="3" fill="#fff7a8"/>
    </svg>`;
  }

  function trophy(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="110" rx="34" ry="6" fill="#1f2937" opacity=".12"/>
      <path d="M38 18 H82 V50 C82 70 73 80 60 80 C47 80 38 70 38 50 Z" fill="#fbbf24" stroke="#b45309" stroke-width="3"/>
      <path d="M38 26 H24 V42 C24 54 30 60 40 60" fill="none" stroke="#b45309" stroke-width="5"/>
      <path d="M82 26 H96 V42 C96 54 90 60 80 60" fill="none" stroke="#b45309" stroke-width="5"/>
      <path d="M52 80 H68 V94 H52 Z" fill="#d97706"/>
      <rect x="40" y="94" width="40" height="10" rx="4" fill="#b45309"/>
      <path d="M60 32 l3.5 7 7.5 1-5.5 5.4 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6-5.5-5.4 7.5-1z" fill="#fff8d6"/>
    </svg>`;
  }

  function logo() {
    return `<div class="logo-wrap">${mouse(190)}${cheese(80)}
      <div class="logo-text"><b>Мишоловки</b><span>гра для спритних пальців</span></div>
    </div>`;
  }

  function check(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#22c55e"/>
      <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  /* --- Прикраси сертифіката: лаврові гілки, кутовий візерунок і печатка --- */
  function certLaurel(size) {
    var branch = '<path d="M12 42 Q20 18 46 10" fill="none" stroke="#b8860b" stroke-width="2.5" stroke-linecap="round"/>';
    for (var i = 0; i < 5; i++) {
      var x = 18 + i * 7, y = 34 - i * 5.5;
      branch += '<ellipse cx="' + x + '" cy="' + y + '" rx="8" ry="3.6" transform="rotate(-40 ' + x + ' ' + y + ')" fill="' +
        (i % 2 ? '#f2d384' : '#d4a72c') + '"/>';
    }
    return `<svg class="cert-laurel" width="${size}" height="${Math.round(size * 52 / 120)}" viewBox="0 0 120 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${branch}
      <g transform="translate(120,0) scale(-1,1)">${branch}</g>
      <path d="M60 5 l2.7 5.6 6.2.9-4.5 4.3 1.1 6.1-5.5-2.9-5.5 2.9 1.1-6.1-4.5-4.3 6.2-.9z" fill="#fbbf24" stroke="#b45309" stroke-width="1"/>
    </svg>`;
  }

  function certCorner() {
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 2 H56 M2 2 V56" fill="none" stroke="#a16207" stroke-width="3" stroke-linecap="round"/>
      <path d="M9 9 H45 M9 9 V45" fill="none" stroke="#f2d384" stroke-width="1.5"/>
      <path d="M16 16 q10 0 10 10 q0-10 10-10" fill="none" stroke="#a16207" stroke-width="2"/>
      <circle cx="16" cy="16" r="3.2" fill="#a16207"/>
      <circle cx="45" cy="16" r="2" fill="#f2d384"/>
      <circle cx="16" cy="45" r="2" fill="#f2d384"/>
    </svg>`;
  }

  function certSeal(size) {
    var scallops = '';
    for (var i = 0; i < 36; i++) {
      var a = i * Math.PI * 2 / 36;
      scallops += '<circle cx="' + (80 + Math.cos(a) * 70).toFixed(1) + '" cy="' +
        (80 + Math.sin(a) * 70).toFixed(1) + '" r="9" fill="#a51d1d"/>';
    }
    return `<svg class="cert-seal" width="${size}" height="${size}" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <path id="sealTop" d="M 32,80 A 48,48 0 0 1 128,80"/>
        <path id="sealBottom" d="M 32,80 A 48,48 0 0 0 128,80"/>
      </defs>
      ${scallops}
      <circle cx="80" cy="80" r="70" fill="#a51d1d"/>
      <circle cx="80" cy="80" r="62" fill="#c62828" stroke="#7f1d1d" stroke-width="2"/>
      <circle cx="80" cy="80" r="49" fill="none" stroke="#fecaca" stroke-width="1.4"/>
      <text fill="#fff5f5" font-size="12" font-weight="900" letter-spacing="2" font-family="Arial, sans-serif">
        <textPath href="#sealTop" startOffset="50%" text-anchor="middle">МИШОЛОВКИ</textPath>
      </text>
      <text fill="#fff5f5" font-size="9.5" font-weight="800" letter-spacing="1.4" font-family="Arial, sans-serif">
        <textPath href="#sealBottom" startOffset="50%" text-anchor="middle">МАЙСТЕР МИШІ</textPath>
      </text>
      <path d="M80 54 l5.2 10.6 11.7 1.7-8.5 8.2 2 11.6-10.4-5.5-10.4 5.5 2-11.6-8.5-8.2 11.7-1.7z" fill="#fde68a" stroke="#7f1d1d" stroke-width="1.2"/>
      <circle cx="80" cy="80" r="18" fill="none" stroke="#fecaca" stroke-width="1" opacity=".7"/>
    </svg>`;
  }

  return { mouse: mouse, cheese: cheese, star: star, firecracker: firecracker, trophy: trophy,
    logo: logo, check: check, certLaurel: certLaurel, certCorner: certCorner, certSeal: certSeal };
})();
