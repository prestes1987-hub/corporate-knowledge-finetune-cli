# Justificativa: por que fine-tuning — e para quê

> Orientação sobre aplicabilidade: quando o fine-tuning é a escolha certa para um assistente de conhecimento interno,
> o que ele resolve e o que ele **não** deve resolver.

## O problema

A Lumora tem políticas, processos e manuais espalhados. O assistente precisa:

1. responder **com base nos documentos internos** (não no "conhecimento geral" do modelo);
2. **recusar** quando a base não cobre a pergunta, em vez de inventar uma política plausível;
3. **citar a fonte**, para o colaborador conferir;
4. rodar **dentro da empresa** (LGPD, documentos Confidenciais/Restritos — POL-SEGURANCA §2–3), com custo baixo.

## A decisão em uma frase

> **O conhecimento fica nos documentos (grounding/RAG); o comportamento vai para os pesos (fine-tuning).**

O fine-tuning **não** é usado para "ensinar as políticas" ao modelo. É usado para ensinar um modelo pequeno a **se
comportar como um assistente fundamentado**: ler o contexto, responder só com ele, copiar números exatos, citar
`[ID]` e recusar quando o contexto não responde.

## Por que não só fine-tuning (conhecimento nos pesos)

| Problema | Consequência |
|---|---|
| Políticas mudam (a POL-HOMEOFFICE está na v2.1; a POL-SEGURANCA, na v5.3) | Cada mudança exigiria retreinar e reavaliar o modelo. Com grounding, basta trocar o arquivo da base. |
| ~50 exemplos não cobrem 46 seções com números exatos | O modelo "decoraria" uma parte e preencheria o resto com valores plausíveis — exatamente a alucinação que queremos eliminar. |
| Sem fonte | Fine-tuning sozinho não consegue apontar *de onde* veio a resposta; a auditoria fica impossível. |
| Controle de acesso | Um documento Restrito "dentro dos pesos" vaza para qualquer usuário do modelo. No contexto, o acesso pode ser filtrado por usuário antes da busca. |

O modo **"fine-tunado, sem grounding"** da avaliação existe para medir isso: o modelo treinado, sem documentos, não
deve acertar fatos que não viu — o ideal é que **recuse** (comportamento aprendido), mas nunca que invente.

## Por que não só prompt (grounding sem fine-tuning)

Grounding por prompt resolve boa parte do problema com modelos grandes. Com um modelo pequeno, que roda on-premise
(Qwen2.5-1.5B em 4-bit cabe em uma GPU de 16 GB, ou até em CPU), as instruções do system prompt são seguidas de forma
**inconsistente**. Falhas típicas que a baseline "com grounding (só prompt)" deve expor:

- **Recusa fraca diante de distratores.** A busca quase sempre traz algo parecido: "auxílio-funeral" recupera
  "auxílio-creche"; "limite do cartão corporativo" recupera "limites de alimentação". O modelo base tende a responder
  com o trecho parecido. O [relatório de recuperação](retrieval-report.md) mostra por que isso não dá para resolver
  só com threshold: para barrar a maioria das perguntas fora da base seria preciso descartar a fonte de ~30% das
  perguntas legítimas.
- **Mistura de conhecimento externo.** Ex.: responder férias pela CLT genérica, ou citar um "vale-transporte" que a
  base não menciona.
- **Formato instável.** Esquece a linha `Fonte: [ID]`, responde em vários parágrafos, troca idioma.

São falhas de **comportamento**, recorrentes e bem definidas — o tipo de coisa que o fine-tuning corrige com poucos
exemplos, porque não precisa ensinar fatos novos, só um padrão de resposta.

## Por que fine-tuning foi a escolha certa *aqui*

| Critério | Situação neste caso | Favorece |
|---|---|---|
| O que precisa mudar é **comportamento** (formato, recusa, citação), não conhecimento | Sim | Fine-tuning |
| O conhecimento muda com frequência e precisa de fonte | Sim | Grounding |
| Restrição de dados (documentos internos não podem ir para API pública — POL-SEGURANCA §3) | Sim | Modelo pequeno local → precisa de fine-tuning para seguir as regras |
| Volume alto de perguntas repetitivas (RH, TI, Financeiro) | Sim | Modelo pequeno fine-tunado: latência e custo por consulta baixos |
| Há exemplos bons e baratos de produzir | Sim: 50 exemplos escritos a partir da própria base, com contexto real da busca | Fine-tuning |
| Hardware de treino disponível | Colab T4 gratuito basta com **QLoRA** (base em 4-bit NF4) + **LoRA** (r=16; < 1% dos parâmetros treináveis) | Fine-tuning |

### Decisões de desenho que sustentam essa escolha

- **O treino usa o mesmo contexto da produção.** Cada exemplo leva os 3 trechos que a busca BM25 realmente recupera
  (inclusive os distratores), no mesmo formato de `src/context.ts`. O modelo aprende a lidar com o que vai ver de fato.
- **24% dos exemplos de treino são "fora da base"**, com distratores, e a resposta-alvo é a recusa padrão — que
  aponta o canal oficial (Portal do Colaborador, MAN-SUPORTE §1), e não um beco sem saída.
- **Loss só na resposta** (*prompt-completion*): o modelo não é treinado para reproduzir os documentos, e sim para
  responder a partir deles.
- **Teste separado do treino**: nenhuma pergunta de teste aparece no treino; a maioria pede um fato que nenhuma
  resposta de treino traz (ex.: ajuda de custo do 100% remoto, R$ 250, contra R$ 150 do híbrido no treino), 3 seções
  só aparecem no teste (POL-FERIAS §3, POL-SEGURANCA §6, PROC-COMPRAS §4) e as 4 perguntas fora da base são inéditas.
  Assim a avaliação mede principalmente se o comportamento generaliza, e não memorização. As exceções conhecidas são
  te-12 e te-16, que reaproveitam fatos presentes em respostas de treino.
- **Defesa em profundidade fora do modelo**: threshold de cobertura (sem trecho relevante → nem chama o LLM),
  delimitadores neutralizados e checagem de citação inventada na CLI.

## Quando esta orientação NÃO se aplica

- **Modelo grande via API e sem restrição de dados**: um bom prompt com grounding costuma bastar. Comece por aí e só
  treine se a avaliação mostrar falhas de comportamento recorrentes.
- **Base pequena e estável, sem necessidade de fonte** (ex.: 20 respostas fixas de FAQ): um classificador de intenção
  ou até uma tabela de respostas é mais simples e mais barato.
- **Necessidade de raciocínio sobre muitos documentos longos**: o gargalo passa a ser a recuperação (chunking,
  embeddings, re-ranking), não o modelo.
- **Sem dados de avaliação**: sem um conjunto de teste como o deste projeto, não há como saber se o fine-tuning ajudou
  ou só mudou o estilo.

## Como confirmar a decisão com números

O notebook mede os quatro cenários no mesmo conjunto de teste ([baseline.md](baseline.md) descreve o protocolo).
A hipótese é confirmada se:

1. **base com grounding** > **base sem grounding** em acurácia factual e alucinação → o grounding é necessário;
2. **fine-tunado com grounding** > **base com grounding** em recusa fora da base, citação e alucinação, sem perder
   acurácia factual → o fine-tuning agrega o comportamento que o prompt sozinho não garante;
3. **fine-tunado sem grounding** não acerta os fatos (e, de preferência, recusa) → o fine-tuning não substitui a base.
