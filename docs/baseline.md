# Baseline documentada

> A baseline é o ponto de comparação do fine-tuning: o **mesmo modelo, antes do treino**, no **mesmo conjunto de
> teste**, com as **mesmas métricas**. Ela é executada pelo notebook (seção 4) antes de qualquer ajuste de pesos.

## Configuração

| Item | Valor |
|---|---|
| Modelo base | `Qwen/Qwen2.5-1.5B-Instruct` |
| Quantização | 4-bit NF4, double quantization, compute dtype fp16 (`BitsAndBytesConfig`); demais camadas em fp16 — a mesma base usada no QLoRA |
| Geração | greedy (`do_sample=False`), `max_new_tokens=200`, chat template do modelo |
| Conjunto de teste | `dataset/test.parquet` — 20 perguntas: 15 na base, 1 multi-documento, 4 fora da base |
| Contexto (modo com grounding) | 3 trechos recuperados por BM25, formatados por `src/context.ts` (coluna `prompt`) |
| Métricas | `colab/avaliacao.py` (definições abaixo) |
| Hardware | Google Colab, GPU T4 |

## Os dois modos da baseline

### 1. Base, sem grounding

```
system: Você é o Assistente de Conhecimento Interno da Lumora Tecnologia.
        Responda às dúvidas dos colaboradores sobre políticas, benefícios e processos da empresa, ...
user:   Qual o valor da ajuda de custo para quem trabalha 100% remoto?
```

Representa o "chatbot genérico" que a empresa teria sem conectar a IA aos dados. O modelo não conhece a Lumora:
qualquer número específico que ele der é **inventado**. Esperado: acurácia factual perto de zero, alucinação alta
(sobretudo nas perguntas fora da base, que ele tende a responder como se a política existisse).

### 2. Base, com grounding (só prompt)

```
system: [regras: responder só com <documentos>, recusar com a frase padrão, máx. 3 frases, "Fonte: [ID]"]
user:   <documentos>
        [POL-HOMEOFFICE] Política de Trabalho Híbrido e Remoto — 2. Ajuda de custo
        Colaboradores no modelo híbrido recebem ajuda de custo mensal de R$ 150,00 ...
        ...
        </documentos>

        <pergunta>
        Qual o valor da ajuda de custo para quem trabalha 100% remoto?
        </pergunta>
```

Mede quanto **só o prompt** resolve. Esperado: grande ganho de acurácia factual em relação ao modo 1, mas com falhas
de comportamento — recusa inconsistente quando os trechos são parecidos mas não respondem, citação esquecida,
respostas longas ou com acréscimos externos. É a régua que o fine-tuning precisa superar.

## Métricas

| Métrica | Como é calculada |
|---|---|
| Acurácia factual | média, nas perguntas da base, da fração de fatos obrigatórios (`must_include`) presentes na resposta |
| Respostas completas | % das perguntas da base com todos os fatos |
| Citação correta | % das perguntas da base que citam o(s) `[ID]` do(s) documento(s)-fonte |
| Recusa fora da base | % das perguntas fora da base respondidas com recusa |
| Falsa recusa | % das perguntas da base recusadas sem nenhum fato |
| Alucinação | fora da base: qualquer resposta que não seja recusa; na base: número que não está no contexto/pergunta, ou citação de documento que não estava no contexto |
| Score geral | média de acurácia factual, citação, recusa fora da base e (1 − alucinação) |

Os fatos obrigatórios são comparados em forma canônica (sem acentos e pontuação, palavras inteiras), então
"R$ 1.000,00", "R$1.000" e "1.000 reais" casam com o fato `1 000`. Os testes do projeto garantem que cada fato
obrigatório aparece **na resposta de referência e na seção-fonte**: a régua é a própria base de conhecimento.

## Resultados

Os números são gerados ao rodar o notebook — não há números estimados neste documento. A célula da seção 4 imprime a
tabela da baseline; ao final, a seção 7 gera `relatorio-avaliacao.md` com os quatro modos lado a lado (baseline +
fine-tunado), as diferenças em pontos percentuais, o resultado por pergunta e exemplos de respostas.

Depois de rodar, copie `predictions.jsonl` para `dataset/` e `relatorio-avaliacao.md` para `docs/`. Para regerar o
relatório a qualquer momento:

```bash
python colab/avaliacao.py dataset/predictions.jsonl --report docs/relatorio-avaliacao.md
```

## Como reproduzir

1. `npm run build-dataset` (gera `dataset/train.parquet` e `dataset/test.parquet`).
2. Abra `colab/finetune_qlora.ipynb` no Colab com GPU T4 e envie `train.parquet`, `test.parquet` e `avaliacao.py`.
3. Execute até a seção 4 para obter só a baseline, ou o notebook inteiro para a comparação completa.
