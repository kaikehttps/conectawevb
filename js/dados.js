/* Camada de dados — repositório local de DEMONSTRAÇÃO.
   Guarda o estado no navegador do tablet. No sistema completo, esta camada
   é substituída por chamadas à API, sem alterar serviços nem telas. */
window.CR = window.CR || {};

CR.dados = (function () {
  var CHAVE = 'conecta-residuos-demo-v1';

  // Pesos sempre em centésimos de kg (inteiros) para evitar erro de arredondamento.
  function semente() {
    return {
      demonstracao: true,
      ecoponto: { id: 'eco-central', nome: 'Ecoponto Central' },
      operador: { nome: 'Lia Souza', papel: 'Operadora' },
      pessoas: [
        { id: 'CR-0142', nome: 'Ana Lima', telefone: '88999990000', email: '', cpf: '', moedas: 100, desde: '2026-08-14' },
        { id: 'CR-0097', nome: 'José Ribeiro da Silva', telefone: '88998124410', email: '', cpf: '11122233344', moedas: 64, desde: '2026-06-02' },
        { id: 'CR-0118', nome: 'Maria das Graças Oliveira', telefone: '88996543210', email: 'graca.demo@exemplo.com', cpf: '', moedas: 210, desde: '2026-07-09' },
        { id: 'CR-0125', nome: 'Francisco Alves Bezerra', telefone: '', email: '', cpf: '', moedas: 18, desde: '2026-07-21' },
        { id: 'CR-0131', nome: 'Antônia Pereira Lima', telefone: '88991237788', email: '', cpf: '', moedas: 47, desde: '2026-08-01' }
      ],
      turmas: [
        { codigo: 'CED-8A', escola: 'Escola do Cedro', turma: '8º A', turno: 'manhã', alunos: 25, pontos: 430 },
        { codigo: 'CED-9B', escola: 'Escola do Cedro', turma: '9º B', turno: 'tarde', alunos: 28, pontos: 395 },
        { codigo: 'SAZ-7A', escola: 'Escola Serra Azul', turma: '7º A', turno: 'manhã', alunos: 30, pontos: 512 }
      ],
      estoque: { pet: 3840, papel: 5210, vidro: 2100, aluminio: 630, oleo: 1250 },
      entregas: [
        {
          numero: 'EC-0316', chave: 'semente-1', data: '2026-11-24T08:12:00', operador: 'Lia Souza',
          pessoaId: 'CR-0097', pessoaNome: 'José Ribeiro da Silva',
          itens: [{ material: 'papel', pesoCent: 410 }], pesoTotalCent: 410, moedas: 24, pontos: 0,
          turmaCodigo: null, regra: 'R-2026-11', status: 'confirmada', creditado: true
        },
        {
          numero: 'EC-0317', chave: 'semente-2', data: '2026-11-24T08:47:00', operador: 'Lia Souza',
          pessoaId: null, pessoaNome: null,
          itens: [{ material: 'vidro', pesoCent: 180 }], pesoTotalCent: 180, moedas: 0, pontos: 0,
          turmaCodigo: null, regra: 'R-2026-11', status: 'confirmada', creditado: true
        }
      ],
      proximoCadastro: 143,
      proximaEntrega: 318,
      simularSemInternet: false
    };
  }

  function carregar() {
    try {
      var salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (e) { /* armazenamento indisponível: segue com a semente */ }
    return semente();
  }

  var estado = carregar();

  return {
    estado: function () { return estado; },
    salvar: function () {
      try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* ignora */ }
    },
    restaurar: function () {
      estado = semente();
      this.salvar();
    }
  };
})();
