# Relatório de avaliação — base x fine-tunado, com x sem grounding

> Gerado por `colab/avaliacao.py` a partir das respostas reais dos modelos no conjunto de teste.

## Resumo

| Modo | Acurácia factual ↑ | Respostas completas ↑ | Citação correta ↑ | Recusa fora da base ↑ | Falsa recusa ↓ | Alucinação ↓ | Score geral ↑ |
|---|---|---|---|---|---|---|---|
| Base, sem grounding | 0.0% | 0.0% | 0.0% | 50.0% | 18.8% | 30.0% | 30.0% |
| Base, com grounding (só prompt) | 90.6% | 87.5% | 0.0% | 50.0% | 0.0% | 10.0% | 57.7% |
| Fine-tunado, com grounding | 90.6% | 87.5% | 93.8% | 75.0% | 0.0% | 5.0% | 88.6% |
| Fine-tunado, sem grounding | 3.1% | 0.0% | 0.0% | 25.0% | 6.2% | 35.0% | 23.3% |

## Comparações-chave

**Base, com grounding (só prompt)** em relação a **Base, sem grounding**:

- Acurácia factual ↑: 0.0% → 90.6% (+90.6 p.p.)
- Respostas completas ↑: 0.0% → 87.5% (+87.5 p.p.)
- Citação correta ↑: 0.0% → 0.0% (+0.0 p.p.)
- Recusa fora da base ↑: 50.0% → 50.0% (+0.0 p.p.)
- Falsa recusa ↓: 18.8% → 0.0% (-18.8 p.p.)
- Alucinação ↓: 30.0% → 10.0% (-20.0 p.p.)
- Score geral ↑: 30.0% → 57.7% (+27.7 p.p.)

**Fine-tunado, com grounding** em relação a **Base, com grounding (só prompt)**:

- Acurácia factual ↑: 90.6% → 90.6% (+0.0 p.p.)
- Respostas completas ↑: 87.5% → 87.5% (+0.0 p.p.)
- Citação correta ↑: 0.0% → 93.8% (+93.8 p.p.)
- Recusa fora da base ↑: 50.0% → 75.0% (+25.0 p.p.)
- Falsa recusa ↓: 0.0% → 0.0% (+0.0 p.p.)
- Alucinação ↓: 10.0% → 5.0% (-5.0 p.p.)
- Score geral ↑: 57.7% → 88.6% (+30.9 p.p.)

**Fine-tunado, com grounding** em relação a **Base, sem grounding**:

- Acurácia factual ↑: 0.0% → 90.6% (+90.6 p.p.)
- Respostas completas ↑: 0.0% → 87.5% (+87.5 p.p.)
- Citação correta ↑: 0.0% → 93.8% (+93.8 p.p.)
- Recusa fora da base ↑: 50.0% → 75.0% (+25.0 p.p.)
- Falsa recusa ↓: 18.8% → 0.0% (-18.8 p.p.)
- Alucinação ↓: 30.0% → 5.0% (-25.0 p.p.)
- Score geral ↑: 30.0% → 88.6% (+58.6 p.p.)

**Fine-tunado, sem grounding** em relação a **Fine-tunado, com grounding**:

- Acurácia factual ↑: 90.6% → 3.1% (-87.5 p.p.)
- Respostas completas ↑: 87.5% → 0.0% (-87.5 p.p.)
- Citação correta ↑: 93.8% → 0.0% (-93.8 p.p.)
- Recusa fora da base ↑: 75.0% → 25.0% (-50.0 p.p.)
- Falsa recusa ↓: 0.0% → 6.2% (+6.2 p.p.)
- Alucinação ↓: 5.0% → 35.0% (+30.0 p.p.)
- Score geral ↑: 88.6% → 23.3% (-65.3 p.p.)

## Por categoria

| Modo | Na base | Multi-documento | Fora da base |
|---|---|---|---|
| Base, sem grounding | fatos 0.0% · citação 0.0% (n=15) | fatos 0.0% · citação 0.0% (n=1) | recusa 50.0% (n=4) |
| Base, com grounding (só prompt) | fatos 90.0% · citação 0.0% (n=15) | fatos 100.0% · citação 0.0% (n=1) | recusa 50.0% (n=4) |
| Fine-tunado, com grounding | fatos 90.0% · citação 100.0% (n=15) | fatos 100.0% · citação 0.0% (n=1) | recusa 75.0% (n=4) |
| Fine-tunado, sem grounding | fatos 0.0% · citação 0.0% (n=15) | fatos 50.0% · citação 0.0% (n=1) | recusa 25.0% (n=4) |

## Resultado por pergunta

Legenda: ✅ correto · ❌ errado · ⚠️ alucinação (número fora do contexto, citação inventada ou resposta fora da base).

| ID | Categoria | Base, sem grounding | Base, com grounding (só prompt) | Fine-tunado, com grounding | Fine-tunado, sem grounding |
|---|---|---|---|---|---|
| te-01 | Na base | ❌ fatos 0% ⚠️ | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-02 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-03 | Na base | ❌ fatos 0% ⚠️ | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% ⚠️ |
| te-04 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% ⚠️ |
| te-05 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-06 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-07 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-08 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-09 | Na base | ❌ fatos 0% ⚠️ | ❌ fatos 50% | ❌ fatos 50% · fonte ✅ | ❌ fatos 0% ⚠️ |
| te-10 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-11 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-12 | Na base | ❌ fatos 0% ⚠️ | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% ⚠️ |
| te-13 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-14 | Na base | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% · fonte ✅ | ❌ fatos 0% |
| te-15 | Na base | ❌ fatos 0% | ❌ fatos 0% | ❌ fatos 0% · fonte ✅ | ❌ fatos 0% |
| te-16 | Multi-documento | ❌ fatos 0% | ✅ fatos 100% | ✅ fatos 100% | ❌ fatos 50% |
| te-17 | Fora da base | ✅ recusou | ✅ recusou | ✅ recusou | ✅ recusou |
| te-18 | Fora da base | ❌ respondeu ⚠️ | ❌ respondeu ⚠️ | ❌ respondeu ⚠️ | ❌ respondeu ⚠️ |
| te-19 | Fora da base | ✅ recusou | ✅ recusou | ✅ recusou | ❌ respondeu ⚠️ |
| te-20 | Fora da base | ❌ respondeu ⚠️ | ❌ respondeu ⚠️ | ✅ recusou | ❌ respondeu ⚠️ |

## Exemplos de respostas

### te-01 — Estagiário tem direito a férias?

**Referência:**

> Estagiários têm direito a 30 dias de recesso remunerado por ano, conforme a Lei do Estágio.
> Fonte: [POL-FERIAS]

**Base, sem grounding:**

> Sim, estagiários têm direito à férias conforme previsto na legislação trabalhista brasileira. A lei 7.347/86 estabelece que os empregados têm direito aos seguintes tipos de licenças: 
> 
> 1. Licença-maternidade
> 2. Licença-paternidade
> 3. Licença-secreto
> 4. Férias
> 
> Portanto, estagiários também são beneficiados com as férias, podendo usufruir desses prazeres durante seu período de estágio.

**Base, com grounding (só prompt):**

> Sim, estagiários têm direito a 30 dias de recesso remunerado por ano, conforme a Lei do Estágio.

**Fine-tunado, com grounding:**

> Sim, estagiários têm direito a 30 dias de recesso remunerado por ano, conforme a Lei do Estágio.
> Fonte: [POL-FERIAS]

**Fine-tunado, sem grounding:**

> Sim, estagiários têm direito à férias conforme previsto na legislação trabalhista brasileira. O Estatuto do Trabalho (ET) define que os empregados têm direito aos prazos legais para férias, incluindo os estagiários. No entanto, as condições específicas podem variar dependendo do contrato de trabalho ou do regime de trabalho vigentes no local. É importante consultar o seu contrato de trabalho para obter informações mais precisas.

### te-02 — Com quanto tempo de antecedência preciso pedir férias?

**Referência:**

> A solicitação deve ser feita no RH Digital com antecedência mínima de 45 dias da data de início, e o gestor tem até 5 dias úteis para aprovar.
> Fonte: [POL-FERIAS]

**Base, sem grounding:**

> Para solicitar suas férias na Lumora Tecnologia, você deve seguir as instruções abaixo:
> 
> 1. **Previsão do Tempo**: Antes de sua data de término de trabalho, procure a disponibilidade de férias no seu calendário de folha de pagamento.
> 
> 2. **Feriado Previsto**: Selecione um feriado previsto para sua área ou departamento.
> 
> 3. **Solicitação**: Envie uma solicitação formal à sua gerência com os seguintes elementos:
>    - Nome completo
>    - Data de início do período de férias
>    - Justificativa (por exemplo: necessidade profissional, saúde pessoal, etc.)
>    - Documentação adicional que possa ser necessário
> 
> 4. **Aprovação**: A solicitação será avaliada pela gerência, que pode autorizar ou negar a férias dependendo das circunstâncias individuais.
> 
> 5. **

**Base, com grounding (só prompt):**

> De acordo com a política de férias e ausências, você precisa fornecer a solicitação de férias no sistema RH Digital com antecedência mínima de **45 dias** antes da data de início das suas férias.

**Fine-tunado, com grounding:**

> Solicitar férias deve ser feito no sistema RH Digital com antecedência mínima de 45 dias da data de início. O gestor direto tem até 5 dias úteis para aprovar ou recusar.
> Fonte: [POL-FERIAS]

**Fine-tunado, sem grounding:**

> Para solicitar a sua próxima folha de férias, você deve entrar em contato com seu gerente ou departamento de recursos humanos no prazo mínimo de 30 dias antes do início das suas férias. Isso garante que todos os procedimentos necessários sejam cumpridos para garantir uma folha de férias válida.

### te-03 — Vou me casar. Quantos dias de folga eu tenho?

**Referência:**

> Para casamento, você tem 5 dias de licença gala.
> Fonte: [POL-FERIAS]

**Base, sem grounding:**

> Como assistente de conhecimento interno da Lumora Tecnologia, não posso fornecer informações específicas sobre seu plano de férias ou folgas porque isso varia dependendo do seu cargo e das políticas internas da sua organização. No entanto, geralmente os funcionários têm um período de folha de 20 a 30 dias por ano, que pode incluir feriados nacionais, festividades locais e outros dias de folga. Para obter mais detalhes, recomendo entrar em contato diretamente com a sua área de recursos humanos para obter as informações mais precisas.

**Base, com grounding (só prompt):**

> De acordo com a política de férias e ausências da Lumora Tecnologia, você terá 5 dias de licença gala por se casar.

**Fine-tunado, com grounding:**

> De acordo com a política de férias e ausências da Lumora Tecnologia, você terá 5 dias de licença gala por casamento.
> Fonte: [POL-FERIAS]

**Fine-tunado, sem grounding:**

> Como assistente de conhecimento interno da Lumora Tecnologia, não posso fornecer informações específicas sobre seu plano de férias ou folgas porque isso varia entre as empresas. No entanto, geralmente os funcionários têm um período de folha de 20 a 30 dias por ano dependendo do número de horas trabalhadas no mês. Para obter essa informação precisa, você deve consultar diretamente sua organização.

### te-17 — Quantos dias de folga recebo por doação de sangue?

**Referência:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

**Base, sem grounding:**

> Como assistente de conhecimento interno da Lumora Tecnologia, não tenho informações específicas sobre a política de folgas para doações de sangue. A política pode variar entre as diferentes empresas ou organizações. Para obter essa informação precisa, recomendo que você consulte diretamente a equipe de recursos humanos da Lumora Tecnologia.

**Base, com grounding (só prompt):**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

**Fine-tunado, com grounding:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

**Fine-tunado, sem grounding:**

> Como assistente de conhecimento interno da Lumora Tecnologia, não tenho informações específicas sobre a política de folgas para doações de sangue. Por favor, consulte as normas gerais da sua organização ou fale com um representante humano para obter essa informação mais precisa.

### te-18 — Qual o limite do cartão corporativo?

**Referência:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

**Base, sem grounding:**

> O limite do cartão corporativo da Lumora Tecnologia pode variar dependendo das regras específicas estabelecidas pela empresa. No geral, os limites são definidos para evitar a utilização excessiva ou desviada do dinheiro fornecido pelo cartão.
> 
> Para obter informações mais precisas, recomenda-se entrar em contato diretamente com a área financeira ou contabilidade da Lumora Tecnologia. Eles podem fornecer detalhes específicos sobre o seu limite atual e as condições aplicáveis ao uso do cartão.

**Base, com grounding (só prompt):**

> R$ 450,00 em capitais e R$ 300,00 nas demais cidades.

**Fine-tunado, com grounding:**

> R$ 450,00 em capitais e R$ 300,00 nas demais cidades.
> Fonte: [POL-BENEFICIOS]

**Fine-tunado, sem grounding:**

> O limite do cartão corporativo da Lumora Tecnologia pode variar dependendo das condições específicas do plano de benefícios ou contratos individuais. Para obter informações precisas, seria necessário consultar diretamente a equipe de recursos humanos ou o gerente de benefícios da sua organização.

## Definição das métricas

- **Acurácia factual**: média, nas perguntas da base, da fração de fatos obrigatórios (`must_include`) presentes na resposta.
- **Respostas completas**: % de perguntas da base com todos os fatos obrigatórios.
- **Citação correta**: % de perguntas da base em que a resposta cita o(s) ID(s) do(s) documento(s)-fonte, ex.: `[POL-FERIAS]`.
- **Recusa fora da base**: % de perguntas fora da base respondidas com recusa ("não encontrei…").
- **Falsa recusa**: % de perguntas da base recusadas sem trazer nenhum fato.
- **Alucinação**: % de respostas que inventam conteúdo — fora da base, qualquer resposta que não seja recusa; na base, afirmar número ausente do contexto/pergunta ou citar documento que não estava no contexto.
- **Score geral**: média de acurácia factual, citação correta, recusa fora da base e (1 − alucinação).
