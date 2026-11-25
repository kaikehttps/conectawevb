# Conecta Resíduos — sistema do operador do ecoponto

Protótipo navegável do atendimento no balcão, feito primeiro para tablet de ~10".
Abra `index.html` no navegador (não precisa de servidor nem instalação).

## Telas (cada uma abre direto pelo endereço)

| Tela | Endereço |
|---|---|
| Início — identificação do cidadão (aprovada) | `index.html#/atendimento` |
| 1. Cadastrar novo usuário | `#/atendimento/cadastro` |
| 2. Cadastro parecido encontrado | `#/atendimento/cadastro-existente` |
| 3. Usuário cadastrado | `#/atendimento/cadastrado` |
| 4. Pessoa identificada | `#/atendimento/pessoa` |
| 5. Registrar entrega (pesagem) | `#/atendimento/pesagem` |
| 6. Revisar entrega | `#/atendimento/revisao` |
| 7. Entrega registrada | `#/atendimento/concluida` |
| Estoque · Histórico · Configurações | `#/estoque` · `#/historico` · `#/configuracoes` |

Quando aberta direto, a tela é preenchida com o exemplo da demonstração (Ana Lima).

## Roteiro rápido

1. Toque em **Cadastrar Novo Usuário** e digite `Ana Lima` → o sistema encontra o cadastro existente.
2. **Selecionar este usuário** → **Continuar para pesagem** → 2,35 kg de PET.
3. **+ Adicionar outro material** → Papel e papelão, 1 kg → **Vincular a uma turma** (opcional).
4. **Revisar entrega** → **Confirmar entrega** (toque duplo gera um único registro).
5. Em **Configurações**, ligue *Simular sem internet* para ver a entrega salva no tablet.
   *Restaurar dados de demonstração* volta tudo ao início.

## Regra fictícia de moedas (R-2026-11)

PET 10/kg · Papel 6/kg · Vidro 4/kg · Alumínio 25/kg · Óleo 8/kg, arredondado para baixo no total.
Pontos da gincana: 10 por kg quando a entrega é vinculada a uma turma.

## Organização do código

- `js/dados.js` — repositório de demonstração (localStorage). Trocar por API no sistema completo.
- `js/servicos.js` — regras: pessoas e duplicidade, moedas, entregas idempotentes, estoque, envio pendente.
- `js/app.js` — telas e navegação; só conversa com os serviços.
- `js/icones.js`, `css/estilo.css` — identidade visual.
