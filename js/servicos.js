/* Camada de serviços — regras do atendimento, separadas das telas:
   pessoas (cadastro e busca), regra de moedas, entregas, estoque e conexão. */
window.CR = window.CR || {};

CR.servicos = (function () {
  var D = CR.dados;
  function st() { return D.estado(); }

  /* ---------- Formatação ---------- */
  function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }

  function normalizar(v) {
    return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function mascaraTelefone(v) {
    var d = soDigitos(v).slice(0, 11);
    if (!d) return '';
    if (d.length <= 2) return '(' + d;
    var ddd = d.slice(0, 2), r = d.slice(2);
    if (r.length <= 4) return '(' + ddd + ') ' + r;
    if (d.length === 11) return '(' + ddd + ') ' + r.slice(0, 5) + '-' + r.slice(5);
    return '(' + ddd + ') ' + r.slice(0, 4) + '-' + r.slice(4);
  }

  function kg(cent) {
    return (cent / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kg';
  }

  // "2,35" → 235 (centésimos). Retorna NaN se inválido.
  function lerPeso(texto) {
    var t = String(texto || '').trim().replace('.', ',');
    if (!/^\d{1,3}(,\d{0,2})?$/.test(t)) return NaN;
    var partes = t.split(',');
    var dec = (partes[1] || '').padEnd(2, '0');
    return parseInt(partes[0], 10) * 100 + parseInt(dec, 10);
  }

  // Mantém só dígitos e uma vírgula, até 3 inteiros e 2 decimais.
  function limparPeso(texto) {
    var t = String(texto || '').replace(/\./g, ',').replace(/[^\d,]/g, '');
    var i = t.indexOf(',');
    if (i !== -1) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/,/g, '');
    var partes = t.split(',');
    var inteiro = partes[0].replace(/^0+(?=\d)/, '').slice(0, 3);
    if (partes.length > 1) return (inteiro || '0') + ',' + partes[1].slice(0, 2);
    return inteiro;
  }

  function data(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- Materiais e regra de moedas (fictícia, de demonstração) ---------- */
  var REGRA = {
    versao: 'R-2026-11',
    vigencia: '01/11/2026',
    arredondamento: 'para baixo, no total da entrega',
    pontosPorKg: 10
  };
  var MATERIAIS = [
    { id: 'pet', nome: 'Garrafas PET', moedasPorKg: 10 },
    { id: 'papel', nome: 'Papel e papelão', moedasPorKg: 6 },
    { id: 'vidro', nome: 'Vidro', moedasPorKg: 4 },
    { id: 'aluminio', nome: 'Alumínio', moedasPorKg: 25 },
    { id: 'oleo', nome: 'Óleo de cozinha', moedasPorKg: 8 }
  ];
  function material(id) { return MATERIAIS.filter(function (m) { return m.id === id; })[0]; }

  function calcular(itens, turmaCodigo, comPessoa) {
    var total = 0, moedasCent = 0;
    itens.forEach(function (i) {
      total += i.pesoCent;
      moedasCent += i.pesoCent * material(i.material).moedasPorKg;
    });
    return {
      pesoTotalCent: total,
      moedas: comPessoa ? Math.floor(moedasCent / 100) : 0,
      pontos: turmaCodigo ? Math.floor(total * REGRA.pontosPorKg / 100) : 0
    };
  }

  /* ---------- Pessoas ---------- */
  var pessoas = {
    porId: function (id) { return st().pessoas.filter(function (p) { return p.id === id; })[0] || null; },

    buscar: function (termo) {
      var t = normalizar(termo), dig = soDigitos(termo);
      if (!t) return [];
      return st().pessoas.filter(function (p) {
        if (normalizar(p.nome).indexOf(t) !== -1) return true;
        if (normalizar(p.id).indexOf(t) !== -1) return true;
        if (dig.length >= 4 && (soDigitos(p.telefone).indexOf(dig) !== -1 || soDigitos(p.cpf).indexOf(dig) !== -1)) return true;
        return false;
      }).slice(0, 6);
    },

    // Evita cadastro duplicado: mesmo telefone, mesmo e-mail ou mesmo nome.
    parecido: function (dados) {
      var nome = normalizar(dados.nome), tel = soDigitos(dados.telefone), email = normalizar(dados.email);
      return st().pessoas.filter(function (p) {
        if (tel.length >= 10 && soDigitos(p.telefone) === tel) return true;
        if (email && normalizar(p.email) === email) return true;
        return normalizar(p.nome) === nome;
      })[0] || null;
    },

    cadastrar: function (dados) {
      var s = st();
      var p = {
        id: 'CR-' + String(s.proximoCadastro++).padStart(4, '0'),
        nome: dados.nome.trim().replace(/\s+/g, ' '),
        telefone: soDigitos(dados.telefone),
        email: (dados.email || '').trim(),
        cpf: '',
        moedas: 0,
        desde: new Date().toISOString().slice(0, 10)
      };
      s.pessoas.push(p);
      D.salvar();
      return p;
    }
  };

  /* ---------- Turmas (vínculo opcional da entrega) ---------- */
  var turmas = {
    todas: function () { return st().turmas; },
    porCodigo: function (codigo) {
      var c = normalizar(codigo).replace(/\s/g, '');
      return st().turmas.filter(function (t) { return normalizar(t.codigo) === c; })[0] || null;
    },
    nome: function (t) { return t ? t.escola + ' · ' + t.turma : ''; }
  };

  /* ---------- Conexão ---------- */
  var conexao = {
    online: function () { return navigator.onLine !== false && !st().simularSemInternet; },
    simular: function (semInternet) {
      st().simularSemInternet = !!semInternet;
      D.salvar();
      if (!semInternet) entregas.sincronizar();
    }
  };

  /* ---------- Entregas ---------- */
  function aplicarCreditos(e) {
    if (e.creditado) return;
    var p = e.pessoaId ? pessoas.porId(e.pessoaId) : null;
    if (p) p.moedas += e.moedas;
    var t = e.turmaCodigo ? turmas.porCodigo(e.turmaCodigo) : null;
    if (t) t.pontos += e.pontos;
    e.creditado = true;
  }

  var entregas = {
    novaChave: function () { return 'ent-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); },

    porNumero: function (numero) { return st().entregas.filter(function (e) { return e.numero === numero; })[0] || null; },

    // Idempotente: a mesma chave nunca gera um segundo registro, estoque, moedas ou pontos.
    confirmar: function (rascunho) {
      var s = st();
      var existente = s.entregas.filter(function (e) { return e.chave === rascunho.chave; })[0];
      if (existente) return existente;

      var p = rascunho.pessoaId ? pessoas.porId(rascunho.pessoaId) : null;
      var calc = calcular(rascunho.itens, rascunho.turmaCodigo, !!p);
      var e = {
        numero: 'EC-' + String(s.proximaEntrega++).padStart(4, '0'),
        chave: rascunho.chave,
        data: new Date().toISOString(),
        operador: s.operador.nome,
        pessoaId: p ? p.id : null,
        pessoaNome: p ? p.nome : null,
        itens: rascunho.itens.map(function (i) { return { material: i.material, pesoCent: i.pesoCent }; }),
        pesoTotalCent: calc.pesoTotalCent,
        moedas: calc.moedas,
        pontos: calc.pontos,
        turmaCodigo: rascunho.turmaCodigo || null,
        regra: REGRA.versao,
        saldoAnterior: p ? p.moedas : null,
        status: conexao.online() ? 'confirmada' : 'pendente',
        creditado: false
      };
      s.entregas.unshift(e);
      // O material está fisicamente no ponto: o estoque local sobe na hora.
      e.itens.forEach(function (i) { s.estoque[i.material] = (s.estoque[i.material] || 0) + i.pesoCent; });
      // Moedas e pontos só valem depois que o sistema confirma o envio.
      if (e.status === 'confirmada') aplicarCreditos(e);
      D.salvar();
      return e;
    },

    pendentes: function () { return st().entregas.filter(function (e) { return e.status === 'pendente'; }); },

    sincronizar: function () {
      if (!conexao.online()) return 0;
      var lista = this.pendentes();
      lista.forEach(function (e) { e.status = 'confirmada'; aplicarCreditos(e); });
      if (lista.length) D.salvar();
      return lista.length;
    },

    doDia: function () {
      var hoje = new Date().toDateString();
      return st().entregas.filter(function (e) { return new Date(e.data).toDateString() === hoje || e.chave.indexOf('semente') === 0; });
    }
  };

  var estoque = {
    resumo: function () {
      var s = st();
      return MATERIAIS.map(function (m) { return { material: m, pesoCent: s.estoque[m.id] || 0 }; });
    }
  };

  return {
    formato: { soDigitos: soDigitos, mascaraTelefone: mascaraTelefone, kg: kg, lerPeso: lerPeso, limparPeso: limparPeso, data: data },
    REGRA: REGRA,
    MATERIAIS: MATERIAIS,
    material: material,
    calcular: calcular,
    pessoas: pessoas,
    turmas: turmas,
    conexao: conexao,
    entregas: entregas,
    estoque: estoque,
    contexto: function () { var s = st(); return { ecoponto: s.ecoponto, operador: s.operador }; }
  };
})();
