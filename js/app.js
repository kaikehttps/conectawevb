/* Camada visual — telas do atendimento no balcão.
   Só lê e chama CR.servicos; não conhece armazenamento nem regras de cálculo. */
(function () {
  var S = CR.servicos, F = S.formato, I = CR.icones;
  var conteudo = document.getElementById('conteudo');
  var CHAVE_FLUXO = 'conecta-residuos-fluxo';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Estado do atendimento em andamento ---------- */
  function novoFluxo() {
    return {
      busca: '', pessoaId: null, semId: false,
      itens: [{ material: 'pet', peso: '' }], ativo: 0,
      turma: null, turmaAberta: false,
      chave: null, entregaNumero: null,
      cadastro: { nome: '', telefone: '', email: '' },
      parecidoId: null, novoId: null
    };
  }
  function carregarFluxo() {
    try { var s = sessionStorage.getItem(CHAVE_FLUXO); if (s) return JSON.parse(s); } catch (e) { /* ignora */ }
    return novoFluxo();
  }
  var fluxo = carregarFluxo();
  function salvarFluxo() { try { sessionStorage.setItem(CHAVE_FLUXO, JSON.stringify(fluxo)); } catch (e) { /* ignora */ } }
  function reiniciarFluxo() { fluxo = novoFluxo(); salvarFluxo(); }

  // Ao abrir uma tela diretamente pelo endereço, preenche com o exemplo da demonstração.
  function exemploSeVazio(comItens) {
    if (!fluxo.pessoaId && !fluxo.semId) {
      fluxo.pessoaId = 'CR-0142';
      if (comItens) fluxo.itens = [{ material: 'pet', peso: '2,35' }];
    }
  }

  function pessoaAtual() { return fluxo.pessoaId ? S.pessoas.porId(fluxo.pessoaId) : null; }
  function turmaAtual() { return fluxo.turma ? S.turmas.porCodigo(fluxo.turma) : null; }
  function itensValidos() {
    return fluxo.itens.map(function (i) { return { material: i.material, pesoCent: F.lerPeso(i.peso) }; })
      .filter(function (i) { return i.pesoCent > 0; });
  }

  /* ---------- Navegação ---------- */
  var ultimaRota = null;
  // Navega e desenha na hora (pushState não dispara hashchange; voltar/avançar dispara).
  function ir(rota, substituir) {
    if (location.hash !== '#' + rota) history[substituir ? 'replaceState' : 'pushState'](null, '', '#' + rota);
    render();
  }
  function rotaAtual() { return location.hash.replace(/^#/, '') || '/atendimento'; }

  var SECOES = { atendimento: 'Atendimento', estoque: 'Estoque', retiradas: 'Retiradas', historico: 'Histórico', configuracoes: 'Configurações' };

  var rotas = {
    '/atendimento': telaInicio,
    '/atendimento/cadastro': telaCadastro,
    '/atendimento/cadastro-existente': telaExistente,
    '/atendimento/cadastrado': telaCadastrado,
    '/atendimento/pessoa': telaPessoa,
    '/atendimento/pesagem': telaPesagem,
    '/atendimento/revisao': telaRevisao,
    '/atendimento/concluida': telaConcluida,
    '/estoque': telaEstoque,
    '/retiradas': telaRetiradas,
    '/historico': telaHistorico,
    '/configuracoes': telaConfiguracoes
  };

  function render() {
    var rota = rotaAtual();
    var tela = (rotas[rota] || telaInicio)();
    if (!tela) return; // a tela redirecionou
    var secao = rota.split('/')[1] || 'atendimento';

    conteudo.innerHTML = '<div class="cartao"><span class="bolha"></span><div class="miolo ' + (tela.classe || '') + '">' + tela.html + '</div></div>';
    document.getElementById('titulo-secao').textContent = SECOES[secao] || 'Atendimento';
    document.title = (tela.titulo ? tela.titulo + ' · ' : '') + 'Conecta Resíduos';
    document.querySelectorAll('.nav a').forEach(function (a) {
      if (a.getAttribute('data-secao') === secao) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    renderConexao();
    fecharMenu();
    if (rota !== ultimaRota) window.scrollTo(0, 0);
    ultimaRota = rota;
    if (tela.depois) tela.depois();
  }

  function renderConexao() {
    var online = S.conexao.online();
    var pend = S.entregas.pendentes().length;
    document.querySelector('.pilula').classList.toggle('sem-conexao', !online);
    var alvo = document.getElementById('aviso-conexao');
    if (online && !pend) { alvo.innerHTML = ''; return; }
    var texto = online
      ? 'Enviando ' + pend + (pend === 1 ? ' entrega salva' : ' entregas salvas') + ' no tablet…'
      : 'Sem internet. As entregas ficam salvas no tablet e são enviadas quando a conexão voltar.' + (pend ? ' <strong>' + pend + ' aguardando envio.</strong>' : '');
    alvo.innerHTML = '<div class="aviso-conexao" role="status">' + I.get('semInternet') + '<span>' + texto + '</span>' +
      (pend ? '<a class="link" href="#/historico">Ver pendentes</a>' : '') + '</div>';
  }

  /* ---------- Tela inicial (aprovada): identificação do cidadão ---------- */
  function telaInicio() {
    var resultados = '';
    if (fluxo.busca) {
      var achados = S.pessoas.buscar(fluxo.busca);
      if (achados.length) {
        resultados = '<p class="resultados-cabecalho">' + achados.length + (achados.length === 1 ? ' pessoa encontrada' : ' pessoas encontradas') + '</p>' +
          '<ul class="resultados">' + achados.map(function (p) {
            return '<li><button type="button" class="resultado" data-acao="escolher" data-id="' + esc(p.id) + '">' +
              '<span><span class="resultado-nome">' + esc(p.nome) + '</span>' +
              '<span class="resultado-meta">' + esc(p.telefone ? F.mascaraTelefone(p.telefone) : 'Sem telefone') + ' · ' + esc(p.id) + '</span></span>' +
              I.get('seta') + '</button></li>';
          }).join('') + '</ul>';
      } else {
        resultados = '<div class="resultados"><p class="resultado-vazio">Nenhuma pessoa encontrada para “' + esc(fluxo.busca) + '”. ' +
          '<button type="button" class="link" data-acao="cadastrar-busca">Cadastrar esta pessoa</button></p></div>';
      }
    }

    return {
      titulo: 'Identificação',
      classe: 'centro',
      html:
        I.heroi('check') +
        '<h2 class="titulo">Identificação do cidadão</h2>' +
        '<p class="subtitulo">Busque pelo nome ou cadastre um novo usuário</p>' +
        '<form class="busca" data-form="busca" role="search">' +
          '<label class="caixa-busca">' + I.get('busca') +
            '<input name="termo" type="search" placeholder="Nome ou CPF" autocomplete="off" enterkeyhint="search" aria-label="Buscar por nome, CPF, telefone ou identificador" value="' + esc(fluxo.busca) + '">' +
          '</label>' +
          '<button class="botao botao-primario" type="submit">Buscar</button>' +
        '</form>' +
        resultados +
        '<div class="atalhos">' +
          '<button type="button" class="atalho" data-acao="cadastrar">' + I.get('pessoaMais') + '<span>Cadastrar<br>Novo Usuário</span></button>' +
          '<button type="button" class="atalho" data-acao="sem-id">' + I.get('semId') + '<span>Entrega<br>Sem Identificação</span></button>' +
        '</div>',
      depois: function () {
        var form = conteudo.querySelector('[data-form="busca"]');
        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
          fluxo.busca = form.termo.value.trim();
          salvarFluxo();
          render();
          var primeiro = conteudo.querySelector('.resultado');
          if (primeiro) primeiro.focus();
        });
        form.termo.addEventListener('input', function () {
          if (!form.termo.value && fluxo.busca) { fluxo.busca = ''; salvarFluxo(); render(); conteudo.querySelector('[name="termo"]').focus(); }
        });
      }
    };
  }

  /* ---------- Tela 1: cadastro de pessoa ---------- */
  function telaCadastro() {
    var c = fluxo.cadastro;
    return {
      titulo: 'Cadastrar novo usuário',
      classe: 'centro',
      html:
        I.heroi('mais') +
        '<h2 class="titulo">Cadastrar novo usuário</h2>' +
        '<p class="subtitulo">Preencha os dados para registrar uma pessoa no Conecta Resíduos.</p>' +
        '<form class="formulario" data-form="cadastro" novalidate>' +
          '<div class="campo">' +
            '<label for="f-nome">Nome completo <span class="obrigatorio" aria-hidden="true">*</span></label>' +
            '<input id="f-nome" name="nome" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="next" required aria-required="true" aria-describedby="e-nome" value="' + esc(c.nome) + '">' +
            '<p class="campo-erro" id="e-nome" hidden></p>' +
          '</div>' +
          '<div class="campo">' +
            '<label for="f-tel">Telefone / WhatsApp</label>' +
            '<input id="f-tel" name="telefone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(88) 90000-0000" enterkeyhint="next" aria-describedby="e-tel" value="' + esc(c.telefone) + '">' +
            '<p class="campo-erro" id="e-tel" hidden></p>' +
          '</div>' +
          '<div class="campo">' +
            '<label for="f-email">E-mail <span class="opcional">(opcional)</span></label>' +
            '<input id="f-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" enterkeyhint="done" aria-describedby="e-email" value="' + esc(c.email) + '">' +
            '<p class="campo-erro" id="e-email" hidden></p>' +
          '</div>' +
          '<p class="nota">* Campo obrigatório</p>' +
          '<div class="acoes fixo">' +
            '<button class="botao botao-primario" type="submit">Cadastrar e continuar</button>' +
            '<button class="botao botao-secundario" type="button" data-acao="cancelar-cadastro">Cancelar</button>' +
          '</div>' +
        '</form>',
      depois: function () {
        var form = conteudo.querySelector('[data-form="cadastro"]');
        if (!form.nome.value) form.nome.focus();

        form.telefone.addEventListener('input', function () {
          form.telefone.value = F.mascaraTelefone(form.telefone.value);
          erro(form.telefone, '');
        });
        form.nome.addEventListener('input', function () { erro(form.nome, ''); });
        form.email.addEventListener('input', function () { erro(form.email, ''); });
        form.addEventListener('input', function () {
          fluxo.cadastro = { nome: form.nome.value, telefone: form.telefone.value, email: form.email.value };
          salvarFluxo();
        });

        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var dados = { nome: form.nome.value.trim(), telefone: form.telefone.value, email: form.email.value.trim() };
          var primeiroErro = null;
          var tel = F.soDigitos(dados.telefone).length;
          if (dados.nome.replace(/\s/g, '').length < 3) { erro(form.nome, 'Informe o nome completo da pessoa.'); primeiroErro = primeiroErro || form.nome; }
          if (tel && tel < 10) { erro(form.telefone, 'Telefone incompleto. Use DDD + número.'); primeiroErro = primeiroErro || form.telefone; }
          if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) { erro(form.email, 'Confira o e-mail ou deixe em branco.'); primeiroErro = primeiroErro || form.email; }
          if (primeiroErro) { primeiroErro.focus(); return; }

          fluxo.cadastro = dados;
          var parecido = S.pessoas.parecido(dados);
          if (parecido) {
            fluxo.parecidoId = parecido.id;
            salvarFluxo();
            ir('/atendimento/cadastro-existente');
          } else {
            criarPessoa();
          }
        });
      }
    };
  }

  function erro(input, msg) {
    var p = document.getElementById(input.getAttribute('aria-describedby'));
    if (!p) return;
    p.textContent = msg;
    p.hidden = !msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function criarPessoa() {
    var nova = S.pessoas.cadastrar(fluxo.cadastro);
    fluxo.novoId = nova.id;
    fluxo.cadastro = { nome: '', telefone: '', email: '' };
    salvarFluxo();
    ir('/atendimento/cadastrado');
  }

  function linhaPainel(icone, rotulo, valor) {
    return '<div class="painel-linha">' + I.get(icone) + '<div><span class="painel-rotulo">' + rotulo + '</span>' +
      '<span class="painel-valor">' + esc(valor) + '</span></div></div>';
  }

  function mesAno(iso) {
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  /* ---------- Tela 2: conferência de cadastro existente ---------- */
  function telaExistente() {
    if (!fluxo.parecidoId) {
      fluxo.parecidoId = 'CR-0142';
      fluxo.cadastro = { nome: 'Ana Lima', telefone: '(88) 99999-0000', email: '' };
    }
    var p = S.pessoas.porId(fluxo.parecidoId);
    var c = fluxo.cadastro;
    var digitado = [c.nome, c.telefone].filter(Boolean).join(' · ');
    return {
      titulo: 'Cadastro parecido',
      classe: 'centro',
      html:
        I.heroi('busca') +
        '<h2 class="titulo">Encontramos um cadastro parecido</h2>' +
        '<p class="subtitulo">Deseja utilizar essa pessoa?</p>' +
        '<div class="painel">' +
          '<div class="painel-cabeca"><span class="painel-rotulo">Cadastro existente</span>' +
            '<span class="etiqueta">' + I.get('check') + 'Já possui conta</span></div>' +
          linhaPainel('pessoa', 'Nome', p.nome) +
          linhaPainel('telefone', 'Telefone cadastrado', p.telefone ? F.mascaraTelefone(p.telefone) : 'Não informado') +
          linhaPainel('cartao', 'Identificador do cadastro', p.id + ' · desde ' + mesAno(p.desde)) +
        '</div>' +
        (digitado ? '<p class="comparacao">Dados digitados agora: ' + esc(digitado) + '</p>' : '') +
        '<div class="acoes acoes-iguais fixo">' +
          '<button class="botao botao-primario" type="button" data-acao="usar-existente">Selecionar este usuário</button>' +
          '<button class="botao botao-contorno" type="button" data-acao="cadastrar-outra">Cadastrar outra pessoa</button>' +
        '</div>'
    };
  }

  /* ---------- Tela 3: cadastro realizado ---------- */
  function telaCadastrado() {
    var p = S.pessoas.porId(fluxo.novoId || 'CR-0142');
    return {
      titulo: 'Usuário cadastrado',
      classe: 'centro',
      html:
        I.heroi('check') +
        '<h2 class="titulo confirmacao-titulo">' + I.get('check') + 'Usuário cadastrado!</h2>' +
        '<div class="painel">' +
          linhaPainel('pessoa', 'Nome', p.nome) +
          linhaPainel('telefone', 'Telefone', p.telefone ? F.mascaraTelefone(p.telefone) : 'Não informado') +
          linhaPainel('cartao', 'Identificador do cadastro', p.id) +
        '</div>' +
        '<div class="acoes-unica"><button class="botao botao-primario" type="button" data-acao="continuar-nova" data-id="' + esc(p.id) + '">Continuar com esta pessoa</button></div>'
    };
  }

  /* ---------- Tela 4: pessoa identificada ---------- */
  function telaPessoa() {
    exemploSeVazio(false);
    if (fluxo.semId) { ir('/atendimento/pesagem', true); return null; }
    var p = pessoaAtual();
    return {
      titulo: 'Identificação da entrega',
      classe: 'centro',
      html:
        I.heroi('check') +
        '<h2 class="titulo">Identificação da entrega</h2>' +
        '<div class="identificada">' +
          '<div class="identificada-topo">' +
            '<span class="etiqueta">' + I.get('check') + 'Pessoa identificada</span>' +
            '<button type="button" class="link" data-acao="alterar-pessoa">Alterar pessoa</button>' +
          '</div>' +
          '<p class="identificada-nome">' + esc(p.nome) + '</p>' +
          '<p class="identificada-dados">' +
            '<span>Telefone: <strong>' + esc(p.telefone ? F.mascaraTelefone(p.telefone) : 'não informado') + '</strong></span>' +
            '<span>Cadastro: <strong>' + esc(p.id) + '</strong></span>' +
          '</p>' +
        '</div>' +
        '<p class="proximo-passo">Próximo passo: pesar e registrar os materiais entregues.</p>' +
        '<div class="acoes-unica"><button class="botao botao-primario" type="button" data-acao="ir-pesagem">Continuar para pesagem</button></div>'
    };
  }

  /* ---------- Tela 5: registrar entrega (pesagem) ---------- */
  function telaPesagem() {
    exemploSeVazio(true);
    if (fluxo.entregaNumero) { ir('/atendimento/concluida', true); return null; }
    var p = pessoaAtual();
    var ativo = fluxo.itens[fluxo.ativo];
    var usados = fluxo.itens.filter(function (_, i) { return i !== fluxo.ativo; }).map(function (i) { return i.material; });
    var turma = turmaAtual();

    var quem = p
      ? '<div><span class="quem-nome">' + esc(p.nome) + '</span><span class="quem-meta">' + esc(p.id) + '</span></div>'
      : '<div><span class="quem-nome">Entrega sem identificação</span><span class="quem-aviso">O material entra no estoque e não gera moedas.</span></div>';

    var feitos = fluxo.itens.map(function (i, idx) {
      if (idx === fluxo.ativo) return '';
      return '<li class="item-feito"><span class="item-feito-nome">' + esc(S.material(i.material).nome) + '</span>' +
        '<span class="item-feito-peso">' + F.kg(F.lerPeso(i.peso)) + '</span>' +
        '<button type="button" class="botao-icone" data-acao="editar-item" data-idx="' + idx + '" aria-label="Corrigir ' + esc(S.material(i.material).nome) + '">' + I.get('lapis') + '</button>' +
        '<button type="button" class="botao-icone" data-acao="remover-item" data-idx="' + idx + '" aria-label="Remover ' + esc(S.material(i.material).nome) + '">' + I.get('lixeira') + '</button></li>';
    }).join('');

    var chips = S.MATERIAIS.map(function (m) {
      var usado = usados.indexOf(m.id) !== -1;
      return '<label class="material"><input type="radio" name="material" value="' + m.id + '"' +
        (ativo.material === m.id ? ' checked' : '') + (usado ? ' disabled' : '') + '><span>' + esc(m.nome) + '</span></label>';
    }).join('');

    var corpoTurma = '';
    if (fluxo.turmaAberta) {
      corpoTurma = '<div class="turma-corpo" id="turma-corpo">' +
        '<p>A entrega também soma pontos da gincana para a turma escolhida. É opcional.</p>' +
        (turma
          ? '<div class="turma-vinculada"><strong>' + esc(S.turmas.nome(turma)) + ' · ' + esc(turma.turno) + '</strong>' +
            '<button type="button" class="link" data-acao="desvincular">Remover vínculo</button></div>'
          : '<form class="turma-codigo" data-form="turma" novalidate>' +
              '<div class="campo"><label for="f-turma" class="sr">Código da turma</label>' +
              '<input id="f-turma" name="codigo" type="text" autocapitalize="characters" placeholder="Código da turma (ex.: CED-8A)" aria-describedby="e-turma"></div>' +
              '<button type="submit" class="botao botao-secundario">Vincular</button>' +
            '</form><p class="campo-erro" id="e-turma" hidden></p>' +
            '<div class="turma-opcoes" role="group" aria-label="Turmas da campanha ativa">' +
              S.turmas.todas().map(function (t) {
                return '<button type="button" class="turma-opcao" aria-pressed="false" data-acao="vincular" data-codigo="' + esc(t.codigo) + '">' + esc(S.turmas.nome(t)) + '</button>';
              }).join('') +
            '</div>') +
        '</div>';
    }

    return {
      titulo: 'Registrar entrega',
      html:
        '<div class="bloco-titulo"><h2 class="titulo">Registrar entrega</h2></div>' +
        '<div class="quem">' + quem + '<button type="button" class="link" data-acao="alterar-pessoa">Alterar</button></div>' +
        (feitos ? '<ul class="itens-feitos" aria-label="Materiais já pesados">' + feitos + '</ul>' : '') +
        '<fieldset class="materiais-campo">' +
          '<legend class="secao-rotulo">Material</legend>' +
          '<div class="materiais">' + chips + '</div>' +
        '</fieldset>' +
        '<label class="secao-rotulo" for="f-peso">Peso líquido</label>' +
        '<div class="peso" data-acao="focar-peso">' +
          '<input id="f-peso" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" placeholder="0,00" aria-describedby="dica-peso e-peso" value="' + esc(ativo.peso) + '">' +
          '<span class="peso-unidade">kg</span>' +
        '</div>' +
        '<p class="peso-dica" id="dica-peso">Desconte o recipiente. Registre só o material aceito.</p>' +
        '<p class="campo-erro" id="e-peso" hidden></p>' +
        '<button type="button" class="link adicionar" data-acao="adicionar-item"' + (usados.length + 1 >= S.MATERIAIS.length ? ' hidden' : '') + '>' + I.get('mais') + 'Adicionar outro material</button>' +
        '<div class="turma">' +
          '<button type="button" class="turma-cabeca" data-acao="alternar-turma" aria-expanded="' + fluxo.turmaAberta + '" aria-controls="turma-corpo">' +
            'Vincular a uma turma <span class="opcional">(opcional)</span>' +
            (turma ? '<span class="etiqueta">' + esc(turma.turma) + ' · ' + esc(turma.escola) + '</span>' : '') +
            I.get('baixo') +
          '</button>' + corpoTurma +
        '</div>' +
        '<div class="rodape-form fixo"><button type="button" class="botao botao-primario" data-acao="revisar">Revisar entrega</button></div>',
      depois: function () {
        var input = document.getElementById('f-peso');
        ajustarLarguraPeso(input);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (input.isConnected) ajustarLarguraPeso(input); });
        input.addEventListener('input', function () {
          var limpo = F.limparPeso(input.value);
          if (limpo !== input.value) input.value = limpo;
          fluxo.itens[fluxo.ativo].peso = limpo;
          salvarFluxo();
          ajustarLarguraPeso(input);
          mostrarErroPeso('');
        });
        input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') input.blur(); });

        conteudo.querySelectorAll('input[name="material"]').forEach(function (r) {
          r.addEventListener('change', function () {
            fluxo.itens[fluxo.ativo].material = r.value;
            salvarFluxo();
          });
        });

        var formTurma = conteudo.querySelector('[data-form="turma"]');
        if (formTurma) {
          formTurma.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var t = S.turmas.porCodigo(formTurma.codigo.value);
            if (!t) { erro(formTurma.codigo, 'Código não encontrado. Confira com o aluno ou escolha abaixo.'); return; }
            fluxo.turma = t.codigo; salvarFluxo(); render();
          });
        }
      }
    };
  }

  // O campo de peso cresce com o número, deixando "kg" colado ao valor.
  var medidor;
  function ajustarLarguraPeso(input) {
    if (!medidor) {
      medidor = document.createElement('span');
      medidor.setAttribute('aria-hidden', 'true');
      medidor.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre';
      document.body.appendChild(medidor);
    }
    var cs = getComputedStyle(input);
    ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'fontVariantNumeric'].forEach(function (k) { medidor.style[k] = cs[k]; });
    medidor.textContent = input.value || input.placeholder;
    input.style.width = Math.ceil(medidor.getBoundingClientRect().width) + 6 + 'px';
  }

  function mostrarErroPeso(msg) {
    var p = document.getElementById('e-peso');
    var caixa = conteudo.querySelector('.peso');
    if (!p) return;
    p.textContent = msg; p.hidden = !msg;
    caixa.classList.toggle('invalido', !!msg);
    var input = document.getElementById('f-peso');
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  // Valida o material em edição. Retorna true se o peso é aceitável.
  function validarAtivo() {
    var cent = F.lerPeso(fluxo.itens[fluxo.ativo].peso);
    if (!(cent > 0)) { mostrarErroPeso('Informe o peso líquido mostrado na balança.'); document.getElementById('f-peso').focus(); return false; }
    if (cent > 50000) { mostrarErroPeso('Peso acima de 500 kg. Confira o valor da balança.'); document.getElementById('f-peso').focus(); return false; }
    return true;
  }

  /* ---------- Tela 6: revisar entrega ---------- */
  function linhasMateriais(itens) {
    return itens.map(function (i) {
      return '<tr><td>' + esc(S.material(i.material).nome) + '</td><td class="num">' + F.kg(i.pesoCent) + '</td></tr>';
    }).join('');
  }

  function telaRevisao() {
    if (fluxo.entregaNumero) { ir('/atendimento/concluida', true); return null; }
    if (!fluxo.pessoaId && !fluxo.semId) {
      fluxo.pessoaId = 'CR-0142';
      fluxo.itens = [{ material: 'pet', peso: '2,35' }, { material: 'papel', peso: '1,00' }];
      fluxo.ativo = 1;
    }
    var itens = itensValidos();
    if (!itens.length) { ir('/atendimento/pesagem', true); return null; }
    if (!fluxo.chave) { fluxo.chave = S.entregas.novaChave(); }
    salvarFluxo();

    var p = pessoaAtual(), turma = turmaAtual();
    var calc = S.calcular(itens, turma && turma.codigo, !!p);

    var regra = 'Regra de demonstração ' + S.REGRA.versao + ': ' +
      S.MATERIAIS.map(function (m) { return m.nome.split(' ')[0] + ' ' + m.moedasPorKg + '/kg'; }).join(' · ') +
      '. Arredondamento ' + S.REGRA.arredondamento + '.';

    return {
      titulo: 'Revisar entrega',
      classe: 'largo',
      html:
        '<div class="bloco-titulo"><h2 class="titulo">Revisar entrega</h2></div>' +
        '<div class="pessoa-resumo">' +
          (p ? '<strong>' + esc(p.nome) + '</strong><span>' + esc(p.id) + ' · saldo atual ' + p.moedas + ' moedas</span>'
             : '<strong>Entrega sem identificação</strong><span>O material entra no estoque do ecoponto.</span>') +
        '</div>' +
        '<table class="tabela"><thead><tr><th scope="col">Materiais</th><th scope="col" class="num">Peso líquido</th></tr></thead>' +
          '<tbody>' + linhasMateriais(itens) + '</tbody>' +
          '<tfoot><tr><th scope="row">Peso total</th><td class="num">' + F.kg(calc.pesoTotalCent) + '</td></tr></tfoot>' +
        '</table>' +
        (p
          ? '<div class="linha-valor"><span>Moedas a receber<small>Saldo após a entrega: ' + (p.moedas + calc.moedas) + ' moedas</small></span><strong>' + calc.moedas + ' moedas</strong></div>'
          : '<div class="linha-valor linha-neutra"><span>Sem crédito pessoal</span><strong>—</strong></div>') +
        (turma ? '<div class="linha-valor linha-turma"><span>Turma: ' + esc(S.turmas.nome(turma)) + '</span><strong>' + calc.pontos + ' pontos da gincana</strong></div>' : '') +
        '<p class="regra">' + esc(regra) + '</p>' +
        '<div class="acoes-direita fixo">' +
          '<button class="botao botao-contorno" type="button" data-acao="corrigir">Corrigir pesos</button>' +
          '<button class="botao botao-primario" type="button" data-acao="confirmar">Confirmar entrega</button>' +
        '</div>'
    };
  }

  /* ---------- Tela 7: entrega confirmada ---------- */
  function entregaExemplo() {
    var itens = [{ material: 'pet', pesoCent: 235 }, { material: 'papel', pesoCent: 100 }];
    var c = S.calcular(itens, null, true);
    var p = S.pessoas.porId('CR-0142');
    return { numero: 'EC-0318', data: new Date().toISOString(), operador: 'Lia Souza', pessoaId: p.id, pessoaNome: p.nome, itens: itens,
      pesoTotalCent: c.pesoTotalCent, moedas: c.moedas, pontos: 0, turmaCodigo: null, regra: S.REGRA.versao, saldoAnterior: p.moedas, status: 'confirmada', exemplo: true };
  }

  function telaConcluida() {
    var e = (fluxo.entregaNumero && S.entregas.porNumero(fluxo.entregaNumero)) || entregaExemplo();
    var pendente = e.status === 'pendente';
    var turma = e.turmaCodigo ? S.turmas.porCodigo(e.turmaCodigo) : null;
    var primeiroNome = e.pessoaNome ? e.pessoaNome.split(' ')[0] : '';

    return {
      titulo: pendente ? 'Entrega salva no tablet' : 'Entrega registrada',
      html:
        '<div class="sucesso-topo">' + (pendente ? I.get('nuvem') : I.get('checkCirculo')) +
          '<h2 class="titulo">' + (pendente ? 'Entrega salva no tablet' : 'Entrega registrada com sucesso!') + '</h2></div>' +
        (pendente ? '<p class="aviso-pendente"><strong>Aguardando envio.</strong> ' +
          (e.pessoaId ? 'As moedas ficam disponíveis para ' + esc(primeiroNome) + ' quando o sistema confirmar o envio.' : 'O registro será enviado quando a conexão voltar.') + '</p>' : '') +
        '<div class="sucesso-pessoa"><strong>' + esc(e.pessoaNome || 'Entrega sem identificação') + '</strong>' +
          '<span>Comprovante ' + esc(e.numero) + '</span></div>' +
        '<table class="tabela"><tbody>' + linhasMateriais(e.itens) + '</tbody>' +
          '<tfoot><tr><th scope="row">Peso total</th><td class="num">' + F.kg(e.pesoTotalCent) + '</td></tr></tfoot></table>' +
        (e.pessoaId ? '<div class="linha-valor linha-moedas"><span>' + (pendente ? 'Moedas a liberar' : 'Moedas geradas') + '</span><strong>' + e.moedas + ' moedas</strong></div>' : '') +
        (turma ? '<div class="linha-valor linha-turma"><span>Turma beneficiada: ' + esc(S.turmas.nome(turma)) + '</span><strong>' + e.pontos + ' pontos</strong></div>' : '') +
        '<div class="acoes acoes-iguais">' +
          '<button class="botao botao-primario" type="button" data-acao="nova-entrega">Nova entrega</button>' +
          '<button class="botao botao-contorno" type="button" data-acao="ver-comprovante" data-numero="' + esc(e.numero) + '">Ver comprovante</button>' +
        '</div>'
    };
  }

  /* ---------- Comprovante ---------- */
  function abrirComprovante(numero) {
    var e = S.entregas.porNumero(numero) || entregaExemplo();
    var turma = e.turmaCodigo ? S.turmas.porCodigo(e.turmaCodigo) : null;
    var ctx = S.contexto();
    var d = document.getElementById('comprovante');
    d.innerHTML =
      '<div class="recibo">' +
        '<div class="recibo-cabeca">' + I.get('logo') + '<div><strong id="comprovante-titulo">Comprovante ' + esc(e.numero) + '</strong>' +
          '<span>' + esc(ctx.ecoponto.nome) + ' · Conecta Resíduos</span></div></div>' +
        '<dl>' +
          '<dt>Data</dt><dd>' + esc(F.data(e.data)) + '</dd>' +
          '<dt>Quem entregou</dt><dd>' + esc(e.pessoaNome ? e.pessoaNome + ' (' + e.pessoaId + ')' : 'Sem identificação') + '</dd>' +
          '<dt>Atendido por</dt><dd>' + esc(e.operador) + '</dd>' +
          (turma ? '<dt>Turma</dt><dd>' + esc(S.turmas.nome(turma)) + '</dd>' : '') +
          '<dt>Situação</dt><dd>' + (e.status === 'pendente' ? 'Aguardando envio' : 'Confirmada') + '</dd>' +
        '</dl>' +
        '<table class="tabela"><tbody>' + linhasMateriais(e.itens) + '</tbody>' +
          '<tfoot><tr><th scope="row">Peso total</th><td class="num">' + F.kg(e.pesoTotalCent) + '</td></tr></tfoot></table>' +
        '<dl>' +
          (e.pessoaId ? '<dt>Moedas</dt><dd>' + e.moedas + ' moedas</dd>' : '') +
          (turma ? '<dt>Pontos da gincana</dt><dd>' + e.pontos + ' pontos</dd>' : '') +
          '<dt>Regra aplicada</dt><dd>' + esc(e.regra) + '</dd>' +
        '</dl>' +
        '<p class="recibo-rodape">Documento de demonstração · dados fictícios</p>' +
      '</div>' +
      '<div class="recibo-acoes">' +
        '<button type="button" class="botao botao-secundario" data-acao="imprimir">Imprimir</button>' +
        '<button type="button" class="botao botao-primario" data-acao="fechar-comprovante">Fechar</button>' +
      '</div>';
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }

  /* ---------- Telas de apoio ---------- */
  function telaEstoque() {
    var linhas = S.estoque.resumo();
    var total = linhas.reduce(function (s, l) { return s + l.pesoCent; }, 0);
    return {
      titulo: 'Estoque',
      classe: 'largo',
      html:
        '<div class="bloco-titulo"><h2 class="titulo">Material no ecoponto</h2>' +
        '<p class="subtitulo">Atualizado a cada entrega registrada neste tablet.</p></div>' +
        '<table class="tabela"><thead><tr><th scope="col">Material</th><th scope="col" class="num">Em estoque</th></tr></thead><tbody>' +
          linhas.map(function (l) { return '<tr><td>' + esc(l.material.nome) + '</td><td class="num">' + F.kg(l.pesoCent) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th scope="row">Total</th><td class="num">' + F.kg(total) + '</td></tr></tfoot></table>'
    };
  }

  function telaHistorico() {
    var lista = S.entregas.doDia();
    return {
      titulo: 'Histórico',
      classe: 'largo',
      html:
        '<div class="bloco-titulo"><h2 class="titulo">Entregas de hoje</h2>' +
        '<p class="subtitulo">Toque em uma entrega para ver o comprovante.</p></div>' +
        '<table class="tabela"><thead><tr><th scope="col">Comprovante</th><th scope="col">Pessoa</th><th scope="col" class="num">Peso</th><th scope="col">Situação</th></tr></thead><tbody>' +
          lista.map(function (e) {
            return '<tr class="linha-clicavel" data-acao="ver-comprovante" data-numero="' + esc(e.numero) + '" tabindex="0">' +
              '<td>' + esc(e.numero) + '</td><td>' + esc(e.pessoaNome || 'Sem identificação') + '</td>' +
              '<td class="num">' + F.kg(e.pesoTotalCent) + '</td>' +
              '<td>' + (e.status === 'pendente' ? '<span class="etiqueta etiqueta-alerta">Aguardando envio</span>' : '<span class="etiqueta">Confirmada</span>') + '</td></tr>';
          }).join('') +
        '</tbody></table>'
    };
  }

  function telaRetiradas() {
    return {
      titulo: 'Retiradas',
      classe: 'largo',
      html:
        '<div class="bloco-titulo"><h2 class="titulo">Retiradas</h2>' +
        '<p class="subtitulo">O registro de retiradas pelos catadores entra na próxima etapa desta demonstração.</p></div>' +
        '<a class="botao botao-secundario" href="#/estoque">Ver material no ecoponto</a>'
    };
  }

  function telaConfiguracoes() {
    var ctx = S.contexto();
    return {
      titulo: 'Configurações',
      classe: 'largo',
      html:
        '<div class="bloco-titulo"><h2 class="titulo">Configurações</h2>' +
        '<p class="subtitulo">' + esc(ctx.operador.nome) + ' · ' + esc(ctx.ecoponto.nome) + '</p></div>' +
        '<ul class="lista-simples">' +
          '<li class="alternar"><div><strong>Simular sem internet</strong><span>Para demonstrar entregas salvas no tablet e enviadas depois.</span></div>' +
            '<label class="chave"><input type="checkbox" data-acao="simular-offline" aria-label="Simular sem internet"' + (S.conexao.online() ? '' : ' checked') + '><span></span></label></li>' +
          '<li class="alternar"><div><strong>Restaurar dados de demonstração</strong><span>Volta Ana Lima a 100 moedas e apaga as entregas feitas nesta demonstração.</span></div>' +
            '<button type="button" class="botao botao-contorno" data-acao="restaurar">Restaurar</button></li>' +
        '</ul>'
    };
  }

  /* ---------- Ações ---------- */
  var acoes = {
    'cadastrar': function () { fluxo.cadastro = { nome: '', telefone: '', email: '' }; salvarFluxo(); ir('/atendimento/cadastro'); },
    'cadastrar-busca': function () {
      var termo = fluxo.busca;
      fluxo.cadastro = { nome: /\d/.test(termo) ? '' : termo, telefone: '', email: '' };
      salvarFluxo(); ir('/atendimento/cadastro');
    },
    'sem-id': function () {
      var busca = fluxo.busca; reiniciarFluxo(); fluxo.busca = busca; fluxo.semId = true; salvarFluxo(); ir('/atendimento/pesagem');
    },
    'escolher': function (el) { selecionarPessoa(el.getAttribute('data-id')); },
    'cancelar-cadastro': function () { fluxo.cadastro = { nome: '', telefone: '', email: '' }; salvarFluxo(); ir('/atendimento'); },
    'usar-existente': function () { selecionarPessoa(fluxo.parecidoId); },
    'cadastrar-outra': function () {
      if (!fluxo.cadastro.nome) { ir('/atendimento/cadastro'); return; }
      criarPessoa();
    },
    'continuar-nova': function (el) { selecionarPessoa(el.getAttribute('data-id')); },
    'alterar-pessoa': function () {
      fluxo.pessoaId = null; fluxo.semId = false; fluxo.busca = ''; salvarFluxo(); ir('/atendimento');
    },
    'ir-pesagem': function () { ir('/atendimento/pesagem'); },
    'focar-peso': function (el, ev) { if (ev.target.tagName !== 'INPUT') document.getElementById('f-peso').focus(); },
    'adicionar-item': function () {
      if (!validarAtivo()) return;
      var usados = fluxo.itens.map(function (i) { return i.material; });
      var livre = S.MATERIAIS.filter(function (m) { return usados.indexOf(m.id) === -1; })[0];
      if (!livre) return;
      fluxo.itens.push({ material: livre.id, peso: '' });
      fluxo.ativo = fluxo.itens.length - 1;
      salvarFluxo(); render();
      document.getElementById('f-peso').focus();
    },
    'editar-item': function (el) {
      var idx = +el.getAttribute('data-idx');
      // Se o material em edição ainda está sem peso, descarta essa linha vazia.
      if (!(F.lerPeso(fluxo.itens[fluxo.ativo].peso) > 0)) {
        fluxo.itens.splice(fluxo.ativo, 1);
        if (idx > fluxo.ativo) idx--;
      }
      fluxo.ativo = idx; salvarFluxo(); render();
      document.getElementById('f-peso').focus();
    },
    'remover-item': function (el) {
      var idx = +el.getAttribute('data-idx');
      fluxo.itens.splice(idx, 1);
      if (fluxo.ativo > idx) fluxo.ativo--;
      salvarFluxo(); render();
    },
    'alternar-turma': function () { fluxo.turmaAberta = !fluxo.turmaAberta; salvarFluxo(); render(); },
    'vincular': function (el) { fluxo.turma = el.getAttribute('data-codigo'); salvarFluxo(); render(); },
    'desvincular': function () { fluxo.turma = null; salvarFluxo(); render(); },
    'revisar': function () {
      if (!validarAtivo()) return;
      // Descarta linhas vazias deixadas para trás.
      fluxo.itens = fluxo.itens.filter(function (i) { return F.lerPeso(i.peso) > 0; });
      fluxo.ativo = fluxo.itens.length - 1;
      salvarFluxo(); ir('/atendimento/revisao');
    },
    'corrigir': function () { ir('/atendimento/pesagem'); },
    'confirmar': function (el) {
      if (el.disabled) return;
      el.disabled = true; el.textContent = 'Registrando…';
      var e = S.entregas.confirmar({
        chave: fluxo.chave,
        pessoaId: fluxo.pessoaId,
        itens: itensValidos(),
        turmaCodigo: fluxo.turma
      });
      fluxo.entregaNumero = e.numero; salvarFluxo();
      ir('/atendimento/concluida');
    },
    'nova-entrega': function () {
      reiniciarFluxo(); ir('/atendimento');
      var campo = conteudo.querySelector('[name="termo"]');
      if (campo) campo.focus();
    },
    'ver-comprovante': function (el) { abrirComprovante(el.getAttribute('data-numero')); },
    'fechar-comprovante': function () { document.getElementById('comprovante').close(); },
    'imprimir': function () { window.print(); },
    'restaurar': function () { CR.dados.restaurar(); reiniciarFluxo(); aviso('Dados de demonstração restaurados.'); render(); },
    'abrir-menu': function () { abrirMenu(); },
    'fechar-menu': function () { fecharMenu(); },
    'menu-operador': function (el) {
      var m = document.getElementById('menu-operador');
      m.hidden = !m.hidden; el.setAttribute('aria-expanded', String(!m.hidden));
    },
    'encerrar-turno': function () {
      document.getElementById('menu-operador').hidden = true;
      reiniciarFluxo(); ir('/atendimento');
      aviso('Turno encerrado (demonstração). Na versão completa, o tablet volta para a tela de acesso.');
    }
  };

  function selecionarPessoa(id) {
    var busca = fluxo.busca;
    reiniciarFluxo();
    fluxo.busca = busca;
    fluxo.pessoaId = id;
    salvarFluxo();
    ir('/atendimento/pessoa');
  }

  function abrirMenu() {
    document.getElementById('lateral').classList.add('aberta');
    document.querySelector('.veu').hidden = false;
    document.querySelector('.botao-menu').setAttribute('aria-expanded', 'true');
  }
  function fecharMenu() {
    document.getElementById('lateral').classList.remove('aberta');
    document.querySelector('.veu').hidden = true;
    document.querySelector('.botao-menu').setAttribute('aria-expanded', 'false');
  }

  var temporizador;
  function aviso(msg) {
    var el = document.getElementById('aviso-rapido');
    el.textContent = msg; el.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { el.hidden = true; }, 3600);
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao]');
    var menuOp = document.getElementById('menu-operador');
    if (!menuOp.hidden && !ev.target.closest('.operador')) menuOp.hidden = true;
    if (!el) return;
    var fn = acoes[el.getAttribute('data-acao')];
    if (fn && el.type !== 'checkbox') fn(el, ev);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.matches('tr[data-acao]')) acoes['ver-comprovante'](ev.target);
    if (ev.key === 'Escape') { fecharMenu(); document.getElementById('menu-operador').hidden = true; }
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.matches('[data-acao="simular-offline"]')) {
      S.conexao.simular(ev.target.checked);
      aviso(ev.target.checked ? 'Modo sem internet ativado.' : 'Conexão restabelecida. Entregas pendentes enviadas.');
      render();
    }
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('online', function () { var n = S.entregas.sincronizar(); if (n) aviso(n + ' entrega(s) enviada(s).'); render(); });
  window.addEventListener('offline', render);

  I.preencher(document);
  if (S.conexao.online()) S.entregas.sincronizar();
  render();
})();
