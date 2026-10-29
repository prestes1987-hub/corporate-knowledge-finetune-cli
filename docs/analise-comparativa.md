# Análise comparativa: com x sem grounding, base x fine-tunado

> Resultados reais da execução do notebook [colab/finetune_qlora.ipynb](../colab/finetune_qlora.ipynb) no Google Colab
> (GPU T4), no conjunto de teste de 20 perguntas. Respostas brutas: [dataset/predictions.jsonl](../dataset/predictions.jsonl).
> Relatório completo, pergunta a pergunta: [relatorio-avaliacao.md](relatorio-avaliacao.md). O relatório é
> reproduzível: `python colab/avaliacao.py dataset/predictions.jsonl --report docs/relatorio-avaliacao.md` gera o
> mesmo arquivo.

## Resultado

| Modo | Acurácia factual ↑ | Respostas completas ↑ | Citação correta ↑ | Recusa fora da base ↑ | Falsa recusa ↓ | Alucinação ↓ | Score geral ↑ |
|---|---|---|---|---|---|---|---|
| Base, sem grounding | 0.0% | 0.0% | 0.0% | 50.0% | 18.8% | 30.0% | 30.0% |
| Base, com grounding (só prompt) | 90.6% | 87.5% | 0.0% | 50.0% | 0.0% | 10.0% | 57.7% |
| **Fine-tunado, com grounding** | **90.6%** | **87.5%** | **93.8%** | **75.0%** | **0.0%** | **5.0%** | **88.6%** |
| Fine-tunado, sem grounding | 3.1% | 0.0% | 0.0% | 25.0% | 6.2% | 35.0% | 23.3% |

Modelo: `Qwen/Qwen2.5-1.5B-Instruct` em 4-bit NF4 (QLoRA), com adaptador LoRA r=16 em `q/k/v/o_proj`, treinado por
3 épocas em 50 exemplos. O adaptador está em [adapter/](../adapter/).

## As três hipóteses da justificativa

### 1. O grounding é necessário: confirmada

Sem documentos, o modelo base **não acerta nenhum fato** da empresa (0% de acurácia factual). Com os documentos no
prompt, a acurácia vai para **90,6%** e a alucinação cai de 30% para 10%. Exemplos sem grounding:

- **te-01** ("Estagiário tem direito a férias?"): cita uma "lei 7.347/86" e uma "licença-secreto", que não existem.
- **te-20** ("Como funciona o reajuste salarial anual?"): descreve um processo de RH que a Lumora não tem.

A taxa de 30% **subestima** a alucinação sem grounding. A métrica só marca números fora do contexto e respostas
dadas a perguntas fora da base, e respostas genéricas e erradas sem números, como a do te-01, não são contadas.
O indicador mais fiel nesse modo é a acurácia factual de 0%.

Os 50% de "recusa" do modelo base sem grounding também precisam de leitura cuidadosa: são evasivas do tipo "não
tenho informações específicas, consulte o RH", e não recusas fundamentadas numa base. Ele não sabe o que a empresa
tem ou não tem; só evita responder.

### 2. O fine-tuning agrega comportamento sem perder acurácia: confirmada, com ressalvas

Comparando **fine-tunado com grounding** com **base com grounding**, o mesmo modelo com os mesmos documentos:

| | Base + prompt | Fine-tunado | Diferença |
|---|---|---|---|
| Acurácia factual | 90,6% | 90,6% | = |
| Citação correta | 0,0% | 93,8% | **+93,8 p.p.** |
| Recusa fora da base | 50% (2/4) | 75% (3/4) | +25 p.p. (1 pergunta) |
| Alucinação | 10% (2/20) | 5% (1/20) | −5 p.p. (1 pergunta) |
| Score geral | 57,7% | 88,6% | **+30,9 p.p.** |

- **Citação: ganho claro e robusto.** O system prompt manda terminar com `Fonte: [ID]`, e o modelo base com grounding
  **nunca** fez isso (0 de 16). O fine-tunado cita a fonte certa em 15 de 16 respostas. É o tipo de comportamento que
  o prompt sozinho não garante num modelo pequeno, e que 50 exemplos bastaram para fixar.
- **Acurácia mantida.** O fine-tuning não "estragou" a leitura do contexto, e as respostas ficaram mais curtas e
  diretas (máx. 3 frases), como especificado.
- **Recusa: melhora pequena e com amostra pequena.** O ganho é **uma** pergunta (te-20, reajuste salarial). O modelo
  base respondeu inventando um processo e ainda citou `[POL-SEGURANCA]`; o fine-tunado recusou com a frase padrão.
  Com apenas 4 perguntas fora da base, isso indica a direção, mas não prova o efeito.

### 3. O fine-tuning não substitui a base: confirmada

Sem documentos, o modelo fine-tunado acerta **3,1%** dos fatos e alucina **35%**, uma taxa de alucinação maior que a
da base sem grounding (30%). Exemplos:

- **te-19**: afirma que o plano cobre cirurgia bariátrica, coisa que a base não diz.
- **te-02**: diz que férias se pedem com 30 dias de antecedência; a política diz 45.

Isso confirma o desenho: **o fine-tuning ensinou comportamento, não conhecimento.** Os fatos têm de vir do contexto.
Um ponto não previsto: esperávamos que, sem contexto, o fine-tunado ao menos recusasse. Ele não recusa, porque todos os
exemplos de treino tinham `<documentos>`, então ele nunca aprendeu o que fazer sem eles. Em produção isso não ocorre,
porque o pipeline sempre envia contexto. Mesmo assim, é uma lição de desenho: o dataset precisa cobrir todos os
formatos de entrada que o modelo vai ver.

## Onde o modelo fine-tunado ainda erra

| Pergunta | O que aconteceu | Causa provável |
|---|---|---|
| **te-18** "Qual o limite do cartão corporativo?" (fora da base) | Respondeu "R$ 450,00 em capitais e R$ 300,00 nas demais cidades", que é o limite de **hotel**, e citou `[POL-BENEFICIOS]` | Distrator forte: a busca trouxe trechos com "limite" e valores (POL-REEMBOLSO §3–§4). É exatamente o risco descrito na justificativa, e o fine-tuning reduziu mas não eliminou esse risco. A citação também está errada: o trecho copiado é de POL-REEMBOLSO. |
| **te-15** "Vale-presente de R$ 100, posso aceitar?" | "Não. Valor superior ao permitido (R$ 200)." Conclusão certa, motivo errado: R$ 100 não supera R$ 200, e a regra aplicável é "vales nunca podem ser aceitos" | Raciocínio sobre exceção numa regra com dois critérios; limite de um modelo de 1,5B. A base com grounding errou do mesmo jeito. |
| **te-09** "MFA é obrigatório para quais sistemas?" | "Sistema: Lumora Auth", resposta curta demais e que omite e-mail/VPN | Excesso de concisão aprendido; a base com grounding acertou "e-mail, VPN e sistemas internos". |
| **te-16** (multi-documento) | Fatos corretos, mas **sem** a linha `Fonte:` | Só 2 exemplos multi-documento no treino. |

## Uso correto do contexto

- **Respostas baseadas na fonte**: com grounding, 87,5% das perguntas da base têm todos os fatos, e as respostas
  copiam números exatamente como estão nos documentos (ex.: te-03 "5 dias de licença gala", te-02 "45 dias… 5 dias úteis").
- **Rastreabilidade**: só o fine-tunado entrega a fonte de forma consistente (93,8%), o que permite ao colaborador
  conferir a resposta. Esse é um requisito prático para uso em empresas.
- **Defesa fora do modelo**: perguntas sem nenhuma relação com a base são barradas pelo threshold de cobertura antes
  do LLM ([retrieval-report.md](retrieval-report.md)). Os erros acima acontecem justamente nas perguntas "parecidas",
  que o threshold não consegue separar.

## Conclusão

1. **Conectar a IA aos dados é o que gera precisão.** Sem grounding, nenhum fato certo; com grounding, ~91%.
2. **O fine-tuning (QLoRA + LoRA, 50 exemplos, numa T4 gratuita do Colab) transforma um modelo pequeno num assistente
   utilizável.** Ele passa a citar a fonte, responder no formato combinado e recusar com mais frequência, sem perder
   acurácia. O score geral sobe de 57,7% para 88,6%.
3. **O fine-tuning não substitui a base de conhecimento.** Sozinho, o modelo treinado inventa políticas. A combinação
   grounding + fine-tuning é a arquitetura aplicável: atualizar uma política continua sendo trocar um documento, não
   retreinar.

## Próximos passos sugeridos

- **Mais exemplos fora da base com distratores numéricos**, como te-18 ("limite do cartão" × "limite de hotel"), e
  mais exemplos multi-documento no treino.
- **Exemplos de regras com exceção**, como te-15 ("até R$ 200, exceto vales e dinheiro").
- **Ampliar o teste**: com 4 perguntas fora da base, cada uma vale 25 p.p. Para uma decisão de produção, 50+
  perguntas de teste e revisão humana (ou LLM-as-judge) das respostas.
- **Guarda de citação na CLI**: a checagem de citação já existe em `src/assistant.ts`. O passo seguinte é conferir se
  os números da resposta aparecem no trecho citado; isso pegaria o te-18.
