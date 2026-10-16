# Relatório de recuperação (grounding)

> Gerado por `npm run eval`. Avalia a etapa que conecta a IA aos documentos: a busca encontra o trecho certo?
> O threshold de cobertura separa perguntas da base das de fora da base?

Base: 9 documentos, 46 seções. Perguntas: 54 respondíveis e 16 fora da base (treino + teste).

## Busca

| Métrica | Valor |
|---|---|
| Recall@1 (seção certa em 1º lugar, perguntas de 1 seção) | 87.0% |
| Recall@3 (todas as seções certas no top-3) | 100.0% |
| MRR | 0.963 |

## Threshold de cobertura

Cobertura = fração, ponderada por IDF, dos termos da pergunta presentes no trecho. Abaixo do threshold o trecho
não entra no contexto; se nenhum entrar, o LLM nem é chamado e a resposta é a recusa padrão.

| Threshold | Respondíveis com a fonte mantida | Fora da base barradas antes do LLM |
|---|---|---|
| 0.00 | 100.0% | 6.3% |
| 0.05 | 98.1% | 6.3% |
| 0.10 **(padrão)** | 98.1% | 6.3% |
| 0.15 | 96.3% | 12.5% |
| 0.20 | 94.4% | 18.8% |
| 0.25 | 90.7% | 37.5% |
| 0.30 | 88.9% | 43.8% |
| 0.40 | 70.4% | 62.5% |
| 0.50 | 64.8% | 68.8% |

### Leitura

Com o threshold padrão (0.1), 98.1% das perguntas respondíveis mantêm a fonte no contexto e 6.3% das perguntas fora da base são barradas antes do LLM.
Subir o threshold barra mais perguntas fora da base, mas começa a cortar a fonte de perguntas legítimas — e uma
resposta certa perdida é pior que uma recusa que o modelo pode dar sozinho. Por isso o threshold fica baixo (filtro
grosso) e **a decisão fina "isto responde ou não?" fica com o modelo**: perguntas fora da base costumam trazer
trechos parecidos (ex.: "auxílio-funeral" recupera "licença nojo"). Ensinar o modelo a ler o contexto e recusar
quando ele não responde é justamente o objetivo do fine-tuning — ver [justificativa.md](justificativa.md).

## Perguntas em que a busca não trouxe todas as fontes

Nenhuma: todas as perguntas respondíveis tiveram as seções-fonte recuperadas no top-k.
