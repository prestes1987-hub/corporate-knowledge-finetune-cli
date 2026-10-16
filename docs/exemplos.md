# Exemplos de perguntas e respostas

> Gerado por `npm run build-dataset`. Não edite à mão: a fonte é [src/dataset/qa.ts](../src/dataset/qa.ts).

| Split | Na base | Multi-documento | Fora da base | Total |
|---|---|---|---|---|
| train | 36 | 2 | 12 | 50 |
| test | 15 | 1 | 4 | 20 |

Cada exemplo leva os 3 trechos mais bem ranqueados pela busca BM25 — inclusive nas perguntas fora da base,
em que os trechos são parecidos mas não respondem (distratores). O modelo aprende a responder a partir deles ou recusar.

## Treino

### tr-01 · na base

**Pergunta:** Quantos dias de férias um colaborador CLT tem por ano?

**Contexto recuperado:** POL-FERIAS §1, POL-FERIAS §2, POL-FERIAS §4

**Resposta-alvo:**

> Todo colaborador CLT tem direito a 30 dias corridos de férias a cada 12 meses de trabalho (período aquisitivo). As férias devem ser gozadas nos 12 meses seguintes ao fim desse período.
> Fonte: [POL-FERIAS]

### tr-02 · na base

**Pergunta:** Posso dividir minhas férias em quantas partes?

**Contexto recuperado:** PROC-ONBOARDING §4, POL-FERIAS §2, POL-FERIAS §4

**Resposta-alvo:**

> As férias podem ser divididas em até 3 períodos, desde que um deles tenha no mínimo 14 dias corridos e os demais no mínimo 5 dias corridos cada.
> Fonte: [POL-FERIAS]

### tr-03 · na base

**Pergunta:** Posso vender parte das minhas férias?

**Contexto recuperado:** POL-FERIAS §2, POL-FERIAS §4, POL-HOMEOFFICE §5

**Resposta-alvo:**

> Sim. É possível converter 1/3 das férias (10 dias) em abono pecuniário, solicitando no RH Digital até 15 dias antes do fim do período aquisitivo.
> Fonte: [POL-FERIAS]

### tr-04 · na base

**Pergunta:** Como funciona o day off de aniversário?

**Contexto recuperado:** POL-FERIAS §5

**Resposta-alvo:**

> Você tem direito a 1 day off remunerado no mês do seu aniversário, que deve ser usado dentro do próprio mês e registrado no RH Digital com 7 dias de antecedência. Ele não é cumulativo nem convertido em dinheiro.
> Fonte: [POL-FERIAS]

### tr-05 · na base

**Pergunta:** Qual o prazo para enviar um atestado médico?

**Contexto recuperado:** POL-FERIAS §6, POL-REEMBOLSO §2, POL-CONDUTA §4

**Resposta-alvo:**

> O atestado médico deve ser enviado pelo RH Digital em até 48 horas após o início do afastamento.
> Fonte: [POL-FERIAS]

### tr-06 · na base

**Pergunta:** Quantos dias de licença-paternidade a empresa concede?

**Contexto recuperado:** POL-FERIAS §6, POL-HOMEOFFICE §1, POL-FERIAS §2

**Resposta-alvo:**

> A licença-paternidade é de 20 dias corridos, pelo programa Empresa Cidadã.
> Fonte: [POL-FERIAS]

### tr-07 · na base

**Pergunta:** Quantos dias por semana preciso ir ao escritório?

**Contexto recuperado:** POL-HOMEOFFICE §1, PROC-ONBOARDING §3, PROC-ONBOARDING §2

**Resposta-alvo:**

> No modelo híbrido padrão são 2 dias presenciais por semana, nos dias-âncora definidos pelo time, e 3 dias remotos.
> Fonte: [POL-HOMEOFFICE]

### tr-08 · na base

**Pergunta:** No modelo híbrido eu recebo ajuda de custo? De quanto?

**Contexto recuperado:** POL-HOMEOFFICE §2, POL-HOMEOFFICE §1, POL-BENEFICIOS §6

**Resposta-alvo:**

> Sim. Colaboradores no modelo híbrido recebem ajuda de custo mensal de R$ 150,00 para internet e energia, paga na folha de pagamento.
> Fonte: [POL-HOMEOFFICE]

### tr-09 · na base

**Pergunta:** A empresa fornece cadeira ergonômica para quem está no modelo híbrido?

**Contexto recuperado:** POL-HOMEOFFICE §3, POL-HOMEOFFICE §1, POL-HOMEOFFICE §2

**Resposta-alvo:**

> Não. A cadeira ergonômica é fornecida apenas para colaboradores 100% remotos, mediante solicitação no Portal do Colaborador.
> Fonte: [POL-HOMEOFFICE]

### tr-10 · na base

**Pergunta:** Posso trabalhar alguns dias de fora do Brasil?

**Contexto recuperado:** POL-HOMEOFFICE §5, POL-HOMEOFFICE §4, POL-HOMEOFFICE §1

**Resposta-alvo:**

> Sim, por até 30 dias por ano, com aprovação prévia do gestor e da área de Segurança da Informação, solicitada com 20 dias de antecedência. O uso da VPN corporativa é obrigatório durante todo o período.
> Fonte: [POL-HOMEOFFICE]

### tr-11 · na base

**Pergunta:** Recibo simples serve para pedir reembolso?

**Contexto recuperado:** POL-REEMBOLSO §1, POL-BENEFICIOS §5, POL-REEMBOLSO §2

**Resposta-alvo:**

> Não. Só são aceitos nota fiscal ou cupom fiscal em nome da empresa (CNPJ); recibos simples valem apenas para transporte por táxi.
> Fonte: [POL-REEMBOLSO]

### tr-12 · na base

**Pergunta:** Qual o prazo para lançar um pedido de reembolso?

**Contexto recuperado:** POL-REEMBOLSO §2, PROC-COMPRAS §4, POL-REEMBOLSO §5

**Resposta-alvo:**

> O pedido deve ser lançado no sistema Despesas+ em até 30 dias corridos após a data da despesa, com foto legível do comprovante. Pedidos fora do prazo são recusados automaticamente.
> Fonte: [POL-REEMBOLSO]

### tr-13 · na base

**Pergunta:** Qual o limite de alimentação em uma viagem nacional?

**Contexto recuperado:** POL-REEMBOLSO §3, POL-REEMBOLSO §4, POL-BENEFICIOS §3

**Resposta-alvo:**

> Em viagens nacionais a serviço, o limite de alimentação é de R$ 120,00 por dia.
> Fonte: [POL-REEMBOLSO]

### tr-14 · na base

**Pergunta:** Qual o limite de diária de hotel em São Paulo?

**Contexto recuperado:** POL-REEMBOLSO §4, POL-REEMBOLSO §3, POL-BENEFICIOS §5

**Resposta-alvo:**

> São Paulo é capital, então o limite de diária de hotel é de R$ 450,00 (nas demais cidades, R$ 300,00).
> Fonte: [POL-REEMBOLSO]

### tr-15 · na base

**Pergunta:** Posso comprar a passagem aérea direto no site da companhia?

**Contexto recuperado:** POL-REEMBOLSO §4, PROC-COMPRAS §1, PROC-COMPRAS §2

**Resposta-alvo:**

> Não. Passagens aéreas e hotéis devem ser reservados exclusivamente pela agência credenciada ViaCorp Viagens, com antecedência mínima de 10 dias.
> Fonte: [POL-REEMBOLSO]

### tr-16 · na base

**Pergunta:** Quanto a empresa paga por quilômetro se eu usar meu carro a serviço?

**Contexto recuperado:** POL-REEMBOLSO §5, POL-HOMEOFFICE §2, PROC-COMPRAS §5

**Resposta-alvo:**

> O uso de veículo próprio a serviço é reembolsado a R$ 1,10 por quilômetro rodado, mais pedágios e estacionamento comprovados.
> Fonte: [POL-REEMBOLSO]

### tr-17 · na base

**Pergunta:** Quais são os requisitos da senha corporativa?

**Contexto recuperado:** POL-SEGURANCA §1, MAN-SUPORTE §3, POL-REEMBOLSO §5

**Resposta-alvo:**

> A senha deve ter no mínimo 12 caracteres, combinando letras maiúsculas, minúsculas, números e símbolos, e ser trocada a cada 90 dias. As últimas 5 senhas não podem ser reutilizadas.
> Fonte: [POL-SEGURANCA]

### tr-18 · na base

**Pergunta:** Quais são os níveis de classificação da informação?

**Contexto recuperado:** POL-SEGURANCA §2, POL-SEGURANCA §6, POL-SEGURANCA §3

**Resposta-alvo:**

> São quatro níveis: Pública, Interna, Confidencial e Restrita.
> Fonte: [POL-SEGURANCA]

### tr-19 · na base

**Pergunta:** Posso mandar um documento confidencial para o meu Gmail para trabalhar em casa?

**Contexto recuperado:** POL-SEGURANCA §2, POL-REEMBOLSO §5, POL-HOMEOFFICE §5

**Resposta-alvo:**

> Não. Documentos Confidenciais e Restritos não podem ser enviados a e-mails pessoais nem armazenados em serviços de nuvem não homologados.
> Fonte: [POL-SEGURANCA]

### tr-20 · na base

**Pergunta:** Posso usar o ChatGPT ou outra ferramenta de IA pública para revisar código da empresa?

**Contexto recuperado:** POL-SEGURANCA §3, PROC-ONBOARDING §2, POL-SEGURANCA §2

**Resposta-alvo:**

> Não. É proibido inserir código-fonte proprietário em ferramentas de IA públicas. A única ferramenta de IA generativa homologada para dados Internos é o Lumora Copilot, acessível pela intranet.
> Fonte: [POL-SEGURANCA]

### tr-21 · na base

**Pergunta:** Recebi um e-mail suspeito de phishing. O que eu faço?

**Contexto recuperado:** POL-SEGURANCA §4, POL-SEGURANCA §1, POL-SEGURANCA §2

**Resposta-alvo:**

> Reporte ao SOC em até 1 hora, pelo e-mail seguranca@lumora.com.br ou pelo ramal 4040.
> Fonte: [POL-SEGURANCA]

### tr-22 · na base

**Pergunta:** Quanto a empresa paga do plano de saúde dos dependentes?

**Contexto recuperado:** POL-BENEFICIOS §2, POL-BENEFICIOS §1, POL-HOMEOFFICE §2

**Resposta-alvo:**

> A empresa custeia 50% da mensalidade dos dependentes legais no plano VidaPlena (o titular tem 100% custeado).
> Fonte: [POL-BENEFICIOS]

### tr-23 · na base

**Pergunta:** Qual o prazo para incluir meu filho recém-nascido no plano sem carência?

**Contexto recuperado:** POL-BENEFICIOS §2, POL-BENEFICIOS §1, POL-BENEFICIOS §4

**Resposta-alvo:**

> A inclusão deve ser feita em até 30 dias após o nascimento para ter isenção de carência.
> Fonte: [POL-BENEFICIOS]

### tr-24 · na base

**Pergunta:** Quanto eu pago pelo plano odontológico?

**Contexto recuperado:** POL-BENEFICIOS §2, POL-REEMBOLSO §2, PROC-ONBOARDING §3

**Resposta-alvo:**

> Nada: o plano odontológico OdontoMais tem mensalidade 100% custeada pela empresa para titular e dependentes.
> Fonte: [POL-BENEFICIOS]

### tr-25 · na base

**Pergunta:** A empresa oferece auxílio-creche?

**Contexto recuperado:** POL-BENEFICIOS §4, POL-BENEFICIOS §5

**Resposta-alvo:**

> Sim. Colaboradores com filhos de até 6 anos recebem R$ 600,00 mensais por filho, mediante comprovante de matrícula renovado a cada semestre.
> Fonte: [POL-BENEFICIOS]

### tr-26 · na base

**Pergunta:** A empresa paga pós-graduação?

**Contexto recuperado:** POL-BENEFICIOS §5, POL-HOMEOFFICE §2

**Resposta-alvo:**

> Sim. A Lumora reembolsa 70% de cursos de graduação, pós-graduação e idiomas relacionados à função, limitado a R$ 1.000,00 por mês, com aprovação prévia do gestor e aprovação no curso.
> Fonte: [POL-BENEFICIOS]

### tr-27 · na base

**Pergunta:** Qual a cobertura do seguro de vida?

**Contexto recuperado:** POL-BENEFICIOS §6, POL-BENEFICIOS §1

**Resposta-alvo:**

> O seguro de vida em grupo cobre o equivalente a 24 salários nominais do colaborador, sem custo para ele.
> Fonte: [POL-BENEFICIOS]

### tr-28 · na base

**Pergunta:** O que é o buddy no onboarding?

**Contexto recuperado:** PROC-ONBOARDING §2, PROC-ONBOARDING §3, PROC-ONBOARDING §1

**Resposta-alvo:**

> O buddy é um colega de outro time responsável por apoiar o novo colaborador durante os primeiros 90 dias.
> Fonte: [PROC-ONBOARDING]

### tr-29 · na base

**Pergunta:** Até quando o gestor deve dar o feedback de fim de experiência?

**Contexto recuperado:** PROC-ONBOARDING §4, PROC-ONBOARDING §3, POL-FERIAS §4

**Resposta-alvo:**

> O feedback formal de fim de experiência deve ser dado até o 85º dia.
> Fonte: [PROC-ONBOARDING]

### tr-30 · na base

**Pergunta:** Quem aprova uma compra de R$ 20.000?

**Contexto recuperado:** PROC-COMPRAS §1, PROC-COMPRAS §2, POL-BENEFICIOS §5

**Resposta-alvo:**

> Compras acima de R$ 5.000,00 e até R$ 50.000,00 exigem aprovação do diretor.
> Fonte: [PROC-COMPRAS]

### tr-31 · na base

**Pergunta:** Quantas cotações preciso para uma compra de R$ 15 mil?

**Contexto recuperado:** PROC-COMPRAS §2, PROC-COMPRAS §1, PROC-COMPRAS §3

**Resposta-alvo:**

> Compras acima de R$ 10.000,00 exigem no mínimo 3 cotações de fornecedores diferentes, registradas no sistema Compras+.
> Fonte: [PROC-COMPRAS]

### tr-32 · na base

**Pergunta:** Preciso de aprovação da Segurança para contratar um SaaS barato?

**Contexto recuperado:** PROC-COMPRAS §5, PROC-COMPRAS §1, POL-HOMEOFFICE §5

**Resposta-alvo:**

> Sim. Contratações de software e serviços de nuvem, independentemente do valor, exigem parecer prévio da área de Segurança da Informação e da área Jurídica.
> Fonte: [PROC-COMPRAS]

### tr-33 · na base

**Pergunta:** Posso aceitar um presente de um fornecedor?

**Contexto recuperado:** POL-CONDUTA §1, PROC-COMPRAS §3, PROC-COMPRAS §2

**Resposta-alvo:**

> Sim, até R$ 200,00 por ano por parte relacionada. Acima disso, o presente deve ser recusado ou registrado no Portal de Compliance em até 5 dias úteis, e dinheiro ou vales nunca podem ser aceitos.
> Fonte: [POL-CONDUTA]

### tr-34 · na base

**Pergunta:** Como faço uma denúncia de assédio?

**Contexto recuperado:** POL-CONDUTA §3, POL-CONDUTA §4

**Resposta-alvo:**

> Pelo Canal de Ética, operado por empresa independente: site etica.lumora.com.br ou telefone 0800 777 4321, 24 horas por dia. A denúncia pode ser anônima.
> Fonte: [POL-CONDUTA]

### tr-35 · na base

**Pergunta:** Qual o prazo de atendimento de um chamado de prioridade alta?

**Contexto recuperado:** MAN-SUPORTE §2, MAN-SUPORTE §1, MAN-SUPORTE §4

**Resposta-alvo:**

> Chamados de prioridade alta têm primeiro atendimento em até 4 horas.
> Fonte: [MAN-SUPORTE]

### tr-36 · na base

**Pergunta:** Esqueci minha senha e estou sem o Lumora Auth. O que faço?

**Contexto recuperado:** MAN-SUPORTE §3, POL-SEGURANCA §1

**Resposta-alvo:**

> Ligue para o Service Desk no ramal 2000, de segunda a sexta, das 7h às 21h.
> Fonte: [MAN-SUPORTE]

### tr-37 · multi-documento

**Pergunta:** Perdi meu notebook: o que preciso avisar e como consigo um equipamento reserva?

**Contexto recuperado:** MAN-SUPORTE §4, POL-HOMEOFFICE §3, POL-SEGURANCA §4

**Resposta-alvo:**

> Reporte a perda ao SOC em até 1 hora e envie o boletim de ocorrência em até 24 horas. Para o reserva, abra chamado no Portal do Colaborador: ele é entregue em até 2 dias úteis nas capitais.
> Fonte: [POL-SEGURANCA] [MAN-SUPORTE]

### tr-38 · multi-documento

**Pergunta:** Qual a ajuda de custo do modelo híbrido e qual o valor do vale-refeição por dia?

**Contexto recuperado:** POL-HOMEOFFICE §2, POL-BENEFICIOS §3, POL-HOMEOFFICE §1

**Resposta-alvo:**

> A ajuda de custo do modelo híbrido é de R$ 150,00 por mês, e o vale-refeição/alimentação é de R$ 55,00 por dia útil.
> Fonte: [POL-HOMEOFFICE] [POL-BENEFICIOS]

### tr-39 · fora da base

**Pergunta:** A Lumora paga PLR? Qual o valor?

**Contexto recuperado:** POL-HOMEOFFICE §2, POL-CONDUTA §1, PROC-COMPRAS §5

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-40 · fora da base

**Pergunta:** Qual o valor do vale-transporte?

**Contexto recuperado:** POL-CONDUTA §1, POL-BENEFICIOS §3, POL-REEMBOLSO §1

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-41 · fora da base

**Pergunta:** O plano de saúde da empresa cobre pets?

**Contexto recuperado:** POL-BENEFICIOS §1, POL-BENEFICIOS §2, PROC-ONBOARDING §3

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-42 · fora da base

**Pergunta:** Qual é o salário inicial de um desenvolvedor júnior?

**Contexto recuperado:** POL-BENEFICIOS §6, POL-REEMBOLSO §2

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-43 · fora da base

**Pergunta:** Existe bônus por indicação de candidatos?

**Contexto recuperado:** 

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-44 · fora da base

**Pergunta:** Qual o limite de reembolso de lavanderia em viagens longas?

**Contexto recuperado:** POL-REEMBOLSO §3, POL-REEMBOLSO §4, POL-REEMBOLSO §6

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-45 · fora da base

**Pergunta:** Posso levar meu cachorro para o escritório?

**Contexto recuperado:** POL-HOMEOFFICE §1, POL-REEMBOLSO §5

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-46 · fora da base

**Pergunta:** Qual é o dress code do escritório?

**Contexto recuperado:** POL-HOMEOFFICE §1, POL-REEMBOLSO §5

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-47 · fora da base

**Pergunta:** A empresa oferece licença sabática?

**Contexto recuperado:** POL-FERIAS §6, POL-BENEFICIOS §5

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-48 · fora da base

**Pergunta:** Quanto é o auxílio-funeral pago pela empresa?

**Contexto recuperado:** POL-BENEFICIOS §4, POL-REEMBOLSO §2

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-49 · fora da base

**Pergunta:** Tem estacionamento gratuito no escritório para colaboradores?

**Contexto recuperado:** POL-REEMBOLSO §5, POL-HOMEOFFICE §1

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### tr-50 · fora da base

**Pergunta:** Em que data é pago o 13º salário?

**Contexto recuperado:** POL-REEMBOLSO §2, POL-BENEFICIOS §6, PROC-ONBOARDING §1

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

## Teste

### te-01 · na base

**Pergunta:** Estagiário tem direito a férias?

**Contexto recuperado:** POL-FERIAS §1, POL-FERIAS §5, POL-FERIAS §2

**Resposta-alvo:**

> Estagiários têm direito a 30 dias de recesso remunerado por ano, conforme a Lei do Estágio.
> Fonte: [POL-FERIAS]

### te-02 · na base

**Pergunta:** Com quanto tempo de antecedência preciso pedir férias?

**Contexto recuperado:** POL-FERIAS §3, POL-FERIAS §5, POL-FERIAS §2

**Resposta-alvo:**

> A solicitação deve ser feita no RH Digital com antecedência mínima de 45 dias da data de início, e o gestor tem até 5 dias úteis para aprovar.
> Fonte: [POL-FERIAS]

### te-03 · na base

**Pergunta:** Vou me casar. Quantos dias de folga eu tenho?

**Contexto recuperado:** POL-FERIAS §6, POL-FERIAS §2, POL-FERIAS §4

**Resposta-alvo:**

> Para casamento, você tem 5 dias de licença gala.
> Fonte: [POL-FERIAS]

### te-04 · na base

**Pergunta:** Qual o valor da ajuda de custo para quem trabalha 100% remoto?

**Contexto recuperado:** POL-HOMEOFFICE §2, POL-HOMEOFFICE §1, POL-HOMEOFFICE §3

**Resposta-alvo:**

> No modelo 100% remoto, a ajuda de custo mensal é de R$ 250,00.
> Fonte: [POL-HOMEOFFICE]

### te-05 · na base

**Pergunta:** Em quanto tempo devo devolver o notebook se eu sair da empresa?

**Contexto recuperado:** POL-HOMEOFFICE §3, POL-BENEFICIOS §5, MAN-SUPORTE §4

**Resposta-alvo:**

> Os equipamentos devem ser devolvidos em até 5 dias úteis após o desligamento.
> Fonte: [POL-HOMEOFFICE]

### te-06 · na base

**Pergunta:** Quando o reembolso aprovado cai na conta?

**Contexto recuperado:** POL-REEMBOLSO §2, POL-REEMBOLSO §5, POL-REEMBOLSO §6

**Resposta-alvo:**

> Os reembolsos aprovados são pagos no dia 10 do mês seguinte, por depósito na conta-salário.
> Fonte: [POL-REEMBOLSO]

### te-07 · na base

**Pergunta:** Em viagem internacional, quanto posso gastar por dia com refeições?

**Contexto recuperado:** POL-BENEFICIOS §3, POL-REEMBOLSO §3, POL-REEMBOLSO §6

**Resposta-alvo:**

> Em viagens internacionais, o limite de alimentação é de US$ 70,00 por dia.
> Fonte: [POL-REEMBOLSO]

### te-08 · na base

**Pergunta:** Em que situação posso voar de classe executiva?

**Contexto recuperado:** POL-REEMBOLSO §4, POL-CONDUTA §2

**Resposta-alvo:**

> Voos com duração superior a 8 horas podem ser em classe executiva, com aprovação de diretor.
> Fonte: [POL-REEMBOLSO]

### te-09 · na base

**Pergunta:** A autenticação em dois fatores é obrigatória para quais sistemas?

**Contexto recuperado:** POL-SEGURANCA §1, PROC-ONBOARDING §4, POL-SEGURANCA §6

**Resposta-alvo:**

> O MFA pelo aplicativo Lumora Auth é obrigatório para e-mail, VPN e sistemas internos.
> Fonte: [POL-SEGURANCA]

### te-10 · na base

**Pergunta:** Até quando preciso concluir o treinamento anual de segurança da informação?

**Contexto recuperado:** POL-SEGURANCA §6, POL-SEGURANCA §2, POL-SEGURANCA §4

**Resposta-alvo:**

> O treinamento anual de Segurança da Informação e LGPD deve ser concluído na Lumora Academy até 31 de março de cada ano.
> Fonte: [POL-SEGURANCA]

### te-11 · na base

**Pergunta:** Tem coparticipação no plano de saúde?

**Contexto recuperado:** POL-BENEFICIOS §1, POL-BENEFICIOS §2, PROC-ONBOARDING §3

**Resposta-alvo:**

> Sim: coparticipação de 20% em consultas e exames, limitada a R$ 300,00 por mês por beneficiário.
> Fonte: [POL-BENEFICIOS]

### te-12 · na base

**Pergunta:** Qual o valor do vale-refeição por dia?

**Contexto recuperado:** POL-BENEFICIOS §3, POL-CONDUTA §1, PROC-COMPRAS §5

**Resposta-alvo:**

> O colaborador recebe R$ 55,00 por dia útil em vale-refeição ou vale-alimentação, no cartão Flexi.
> Fonte: [POL-BENEFICIOS]

### te-13 · na base

**Pergunta:** Quanto tempo dura o período de experiência?

**Contexto recuperado:** PROC-ONBOARDING §4, POL-FERIAS §1, POL-FERIAS §2

**Resposta-alvo:**

> O contrato de experiência dura 90 dias, divididos em dois períodos de 45 dias.
> Fonte: [PROC-ONBOARDING]

### te-14 · na base

**Pergunta:** Qual o prazo de pagamento de fornecedores?

**Contexto recuperado:** PROC-COMPRAS §4, POL-REEMBOLSO §2, POL-FERIAS §4

**Resposta-alvo:**

> O prazo padrão é de 45 dias após o recebimento da nota fiscal, com pagamentos apenas às terças e sextas-feiras.
> Fonte: [PROC-COMPRAS]

### te-15 · na base

**Pergunta:** Um fornecedor me ofereceu um vale-presente de R$ 100. Posso aceitar?

**Contexto recuperado:** POL-CONDUTA §1, PROC-COMPRAS §3, POL-BENEFICIOS §3

**Resposta-alvo:**

> Não. Dinheiro, vales ou equivalentes nunca podem ser aceitos, independentemente do valor.
> Fonte: [POL-CONDUTA]

### te-16 · multi-documento

**Pergunta:** Qual o prazo para enviar um atestado médico e para lançar um pedido de reembolso?

**Contexto recuperado:** POL-REEMBOLSO §2, POL-FERIAS §6, PROC-COMPRAS §4

**Resposta-alvo:**

> O atestado deve ser enviado em até 48 horas após o início do afastamento, e o reembolso deve ser lançado no Despesas+ em até 30 dias corridos após a despesa.
> Fonte: [POL-FERIAS] [POL-REEMBOLSO]

### te-17 · fora da base

**Pergunta:** Quantos dias de folga recebo por doação de sangue?

**Contexto recuperado:** PROC-COMPRAS §4, PROC-ONBOARDING §2, MAN-SUPORTE §4

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### te-18 · fora da base

**Pergunta:** Qual o limite do cartão corporativo?

**Contexto recuperado:** POL-REEMBOLSO §3, POL-REEMBOLSO §4, POL-BENEFICIOS §3

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### te-19 · fora da base

**Pergunta:** O plano de saúde cobre cirurgia bariátrica?

**Contexto recuperado:** POL-BENEFICIOS §1, POL-BENEFICIOS §2, PROC-ONBOARDING §3

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.

### te-20 · fora da base

**Pergunta:** Como funciona o reajuste salarial anual?

**Contexto recuperado:** POL-SEGURANCA §6

**Resposta-alvo:**

> Não encontrei essa informação na base de conhecimento interna. Registre um chamado no Portal do Colaborador (portal.lumora.local), na categoria da área responsável.
