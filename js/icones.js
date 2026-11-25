/* Ícones em traço simples (SVG inline), sempre na cor do texto. */
window.CR = window.CR || {};

CR.icones = (function () {
  var T = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  function svg(corpo, extra) { return '<svg viewBox="0 0 24 24" ' + T + ' aria-hidden="true"' + (extra || '') + '>' + corpo + '</svg>'; }

  var mapa = {
    pessoas: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    caixa: svg('<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'),
    caminhao: svg('<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>'),
    relogio: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    engrenagem: svg('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
    busca: svg('<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>'),
    pessoa: svg('<circle cx="12" cy="8" r="4.2"/><path d="M4.5 21v-.8A6.2 6.2 0 0 1 10.7 14h2.6a6.2 6.2 0 0 1 6.2 6.2v.8"/>'),
    pessoaMais: svg('<circle cx="9" cy="8" r="4"/><path d="M2 21v-.6A6 6 0 0 1 8 14.4h2A6 6 0 0 1 16 20.4v.6"/><path d="M19 8v6M16 11h6"/>', ' stroke-width="2.4"'),
    semId: svg('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/><path d="M10.2 7.5h3.6M10.6 7.5v2c-1 .6-1.6 1.5-1.6 2.7V17h6v-4.8c0-1.2-.6-2.1-1.6-2.7v-2"/>', ' stroke-width="2.2"'),
    telefone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    cartao: svg('<rect x="2" y="5" width="20" height="14" rx="2.5"/><circle cx="8" cy="11" r="2"/><path d="M5 16a3 3 0 0 1 6 0"/><path d="M14 10h5M14 14h4"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>', ' stroke-width="3"'),
    checkCirculo: '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="none" stroke="#1f9d55" stroke-width="5"/><path d="M25 41l10 10 20-21" fill="none" stroke="#1f9d55" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    nuvem: '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="none" stroke="#b07800" stroke-width="5"/><path d="M27 50h26a9 9 0 0 0 0-18 13 13 0 0 0-25 3 7.5 7.5 0 0 0-1 15z" fill="none" stroke="#b07800" stroke-width="4.5" stroke-linejoin="round"/><path d="M40 37v10M36 43l4 4 4-4" fill="none" stroke="#b07800" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    seta: svg('<path d="m9 18 6-6-6-6"/>', ' stroke-width="2.4"'),
    baixo: svg('<path d="m6 9 6 6 6-6"/>', ' stroke-width="2.4"'),
    mais: svg('<path d="M12 5v14M5 12h14"/>', ' stroke-width="2.6"'),
    lapis: svg('<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'),
    lixeira: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    semInternet: svg('<path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.18-2.65"/><path d="M19 12.86a10 10 0 0 0-2.04-1.4"/><path d="M5 12.86a10 10 0 0 1 5.17-2.7"/><path d="M22 8.82a15 15 0 0 0-11.29-3.76"/><path d="m2 2 20 20"/>'),
    menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>', ' stroke-width="2.4"'),
    logo: '<svg viewBox="0 0 48 72" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="16.5" y="2" width="15" height="7.5" rx="2"/>' +
      '<path d="M19 9.5v4.5c0 3.4-10 6.2-10 14.6v33.4a7 7 0 0 0 7 7h16a7 7 0 0 0 7-7V28.6c0-8.4-10-11.2-10-14.6V9.5"/>' +
      '<path d="M15.5 56c-.4-13 7.6-21.4 21-22.4.6 13.2-7.6 21.8-21 22.4Z"/>' +
      '<path d="M15.5 56c5.6-5.6 9.6-10 13.4-15.6"/>' +
      '<path d="M20 28.5c4.4-3.4 12-3.4 15.5 1.2"/></svg>'
  };

  // Ilustração central da tela: pessoa + selo verde (mesma linguagem da tela aprovada).
  function heroi(selo, classe) {
    var glifos = {
      check: '<path d="M78 70l7.5 7.5L100 63" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
      mais: '<path d="M89 58v24M77 70h24" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>',
      busca: '<circle cx="86.5" cy="67.5" r="8" fill="none" stroke="#fff" stroke-width="5"/><path d="m92.5 73.5 6 6" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>'
    };
    return '<svg class="heroi ' + (classe || '') + '" viewBox="0 0 124 100" aria-hidden="true">' +
      '<circle cx="50" cy="27" r="17" fill="none" stroke="#0b5d55" stroke-width="5"/>' +
      '<path d="M13 88v-5c0-16 13-28 29-28h16c5 0 9.6 1.2 13.6 3.4" fill="none" stroke="#0b5d55" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M13 88h50" fill="none" stroke="#0b5d55" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="89" cy="70" r="25" fill="#1f9d55" stroke="#fbfcfc" stroke-width="4"/>' +
      glifos[selo] + '</svg>';
  }

  function preencher(raiz) {
    (raiz || document).querySelectorAll('[data-icone]').forEach(function (el) {
      el.innerHTML = mapa[el.getAttribute('data-icone')] || '';
      el.removeAttribute('data-icone');
    });
  }

  return { get: function (n) { return mapa[n] || ''; }, heroi: heroi, preencher: preencher };
})();
