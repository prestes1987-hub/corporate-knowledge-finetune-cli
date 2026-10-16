/**
 * Pares pergunta → resposta de referência, escritos à mão a partir da base de conhecimento.
 *
 * - `answerable`: a resposta está em uma seção da base.
 * - `multi_doc`: a resposta exige combinar seções de documentos diferentes.
 * - `out_of_base`: a base NÃO cobre a pergunta (mas a busca traz trechos parecidos, que funcionam
 *   como distratores). A resposta correta é a recusa padrão.
 *
 * `mustInclude` são os fatos verificáveis que uma resposta correta precisa conter, na forma
 * canônica de `canonical()` (sem acentos/pontuação); alternativas são separadas por "|".
 * Os testes garantem que cada fato aparece na resposta de referência E no trecho-fonte.
 *
 * As perguntas de teste não se repetem no treino e, em sua maioria, pedem fatos que nenhuma resposta
 * de treino traz: a avaliação mede se o modelo aprendeu o COMPORTAMENTO (ler o contexto, citar,
 * recusar), não se decorou respostas.
 */

export type Category = "answerable" | "multi_doc" | "out_of_base";
export type Split = "train" | "test";

export interface QaItem {
  id: string;
  split: Split;
  category: Category;
  question: string;
  /** Resposta de referência sem a linha "Fonte:" (adicionada pelo builder a partir de `sections`). */
  answer: string;
  /** Seções que fundamentam a resposta (vazio em `out_of_base`). */
  sections: string[];
  mustInclude: string[];
}

let trainSeq = 0;
let testSeq = 0;

function nextId(split: Split): string {
  return split === "train" ? `tr-${String(++trainSeq).padStart(2, "0")}` : `te-${String(++testSeq).padStart(2, "0")}`;
}

function qa(split: Split, sections: string[], question: string, answer: string, mustInclude: string[]): QaItem {
  const docs = new Set(sections.map((s) => s.split(" §")[0]));
  return { id: nextId(split), split, category: docs.size > 1 ? "multi_doc" : "answerable", question, answer, sections, mustInclude };
}

function oob(split: Split, question: string): QaItem {
  return { id: nextId(split), split, category: "out_of_base", question, answer: "", sections: [], mustInclude: [] };
}

export const QA_ITEMS: QaItem[] = [
  // ───────────────────────────── TREINO ─────────────────────────────
  // Férias e ausências
  qa("train", ["POL-FERIAS §1"], "Quantos dias de férias um colaborador CLT tem por ano?",
    "Todo colaborador CLT tem direito a 30 dias corridos de férias a cada 12 meses de trabalho (período aquisitivo). As férias devem ser gozadas nos 12 meses seguintes ao fim desse período.",
    ["30 dias"]),
  qa("train", ["POL-FERIAS §2"], "Posso dividir minhas férias em quantas partes?",
    "As férias podem ser divididas em até 3 períodos, desde que um deles tenha no mínimo 14 dias corridos e os demais no mínimo 5 dias corridos cada.",
    ["3 periodos|tres periodos", "14 dias", "5 dias|cinco dias"]),
  qa("train", ["POL-FERIAS §4"], "Posso vender parte das minhas férias?",
    "Sim. É possível converter 1/3 das férias (10 dias) em abono pecuniário, solicitando no RH Digital até 15 dias antes do fim do período aquisitivo.",
    ["10 dias|dez dias", "15 dias"]),
  qa("train", ["POL-FERIAS §5"], "Como funciona o day off de aniversário?",
    "Você tem direito a 1 day off remunerado no mês do seu aniversário, que deve ser usado dentro do próprio mês e registrado no RH Digital com 7 dias de antecedência. Ele não é cumulativo nem convertido em dinheiro.",
    ["aniversario", "7 dias|sete dias"]),
  qa("train", ["POL-FERIAS §6"], "Qual o prazo para enviar um atestado médico?",
    "O atestado médico deve ser enviado pelo RH Digital em até 48 horas após o início do afastamento.",
    ["48 horas|48h"]),
  qa("train", ["POL-FERIAS §6"], "Quantos dias de licença-paternidade a empresa concede?",
    "A licença-paternidade é de 20 dias corridos, pelo programa Empresa Cidadã.",
    ["20 dias"]),

  // Trabalho híbrido e remoto
  qa("train", ["POL-HOMEOFFICE §1"], "Quantos dias por semana preciso ir ao escritório?",
    "No modelo híbrido padrão são 2 dias presenciais por semana, nos dias-âncora definidos pelo time, e 3 dias remotos.",
    ["2 dias|dois dias"]),
  qa("train", ["POL-HOMEOFFICE §2"], "No modelo híbrido eu recebo ajuda de custo? De quanto?",
    "Sim. Colaboradores no modelo híbrido recebem ajuda de custo mensal de R$ 150,00 para internet e energia, paga na folha de pagamento.",
    ["150"]),
  qa("train", ["POL-HOMEOFFICE §3"], "A empresa fornece cadeira ergonômica para quem está no modelo híbrido?",
    "Não. A cadeira ergonômica é fornecida apenas para colaboradores 100% remotos, mediante solicitação no Portal do Colaborador.",
    ["100 remotos|100 remoto"]),
  qa("train", ["POL-HOMEOFFICE §5"], "Posso trabalhar alguns dias de fora do Brasil?",
    "Sim, por até 30 dias por ano, com aprovação prévia do gestor e da área de Segurança da Informação, solicitada com 20 dias de antecedência. O uso da VPN corporativa é obrigatório durante todo o período.",
    ["30 dias", "20 dias", "vpn"]),

  // Reembolso e viagens
  qa("train", ["POL-REEMBOLSO §1"], "Recibo simples serve para pedir reembolso?",
    "Não. Só são aceitos nota fiscal ou cupom fiscal em nome da empresa (CNPJ); recibos simples valem apenas para transporte por táxi.",
    ["nota fiscal|cupom fiscal", "taxi"]),
  qa("train", ["POL-REEMBOLSO §2"], "Qual o prazo para lançar um pedido de reembolso?",
    "O pedido deve ser lançado no sistema Despesas+ em até 30 dias corridos após a data da despesa, com foto legível do comprovante. Pedidos fora do prazo são recusados automaticamente.",
    ["30 dias", "despesas"]),
  qa("train", ["POL-REEMBOLSO §3"], "Qual o limite de alimentação em uma viagem nacional?",
    "Em viagens nacionais a serviço, o limite de alimentação é de R$ 120,00 por dia.",
    ["120"]),
  qa("train", ["POL-REEMBOLSO §4"], "Qual o limite de diária de hotel em São Paulo?",
    "São Paulo é capital, então o limite de diária de hotel é de R$ 450,00 (nas demais cidades, R$ 300,00).",
    ["450"]),
  qa("train", ["POL-REEMBOLSO §4"], "Posso comprar a passagem aérea direto no site da companhia?",
    "Não. Passagens aéreas e hotéis devem ser reservados exclusivamente pela agência credenciada ViaCorp Viagens, com antecedência mínima de 10 dias.",
    ["viacorp", "10 dias"]),
  qa("train", ["POL-REEMBOLSO §5"], "Quanto a empresa paga por quilômetro se eu usar meu carro a serviço?",
    "O uso de veículo próprio a serviço é reembolsado a R$ 1,10 por quilômetro rodado, mais pedágios e estacionamento comprovados.",
    ["1 10"]),

  // Segurança da informação
  qa("train", ["POL-SEGURANCA §1"], "Quais são os requisitos da senha corporativa?",
    "A senha deve ter no mínimo 12 caracteres, combinando letras maiúsculas, minúsculas, números e símbolos, e ser trocada a cada 90 dias. As últimas 5 senhas não podem ser reutilizadas.",
    ["12 caracteres", "90 dias"]),
  qa("train", ["POL-SEGURANCA §2"], "Quais são os níveis de classificação da informação?",
    "São quatro níveis: Pública, Interna, Confidencial e Restrita.",
    ["publica", "interna", "confidencial", "restrita"]),
  qa("train", ["POL-SEGURANCA §2"], "Posso mandar um documento confidencial para o meu Gmail para trabalhar em casa?",
    "Não. Documentos Confidenciais e Restritos não podem ser enviados a e-mails pessoais nem armazenados em serviços de nuvem não homologados.",
    ["e mails pessoais|e mail pessoal|email pessoal|emails pessoais"]),
  qa("train", ["POL-SEGURANCA §3"], "Posso usar o ChatGPT ou outra ferramenta de IA pública para revisar código da empresa?",
    "Não. É proibido inserir código-fonte proprietário em ferramentas de IA públicas. A única ferramenta de IA generativa homologada para dados Internos é o Lumora Copilot, acessível pela intranet.",
    ["lumora copilot"]),
  qa("train", ["POL-SEGURANCA §4"], "Recebi um e-mail suspeito de phishing. O que eu faço?",
    "Reporte ao SOC em até 1 hora, pelo e-mail seguranca@lumora.com.br ou pelo ramal 4040.",
    ["1 hora|uma hora", "4040"]),

  // Benefícios
  qa("train", ["POL-BENEFICIOS §1"], "Quanto a empresa paga do plano de saúde dos dependentes?",
    "A empresa custeia 50% da mensalidade dos dependentes legais no plano VidaPlena (o titular tem 100% custeado).",
    ["50"]),
  qa("train", ["POL-BENEFICIOS §2"], "Qual o prazo para incluir meu filho recém-nascido no plano sem carência?",
    "A inclusão deve ser feita em até 30 dias após o nascimento para ter isenção de carência.",
    ["30 dias"]),
  qa("train", ["POL-BENEFICIOS §2"], "Quanto eu pago pelo plano odontológico?",
    "Nada: o plano odontológico OdontoMais tem mensalidade 100% custeada pela empresa para titular e dependentes.",
    ["odontomais", "100"]),
  qa("train", ["POL-BENEFICIOS §4"], "A empresa oferece auxílio-creche?",
    "Sim. Colaboradores com filhos de até 6 anos recebem R$ 600,00 mensais por filho, mediante comprovante de matrícula renovado a cada semestre.",
    ["600", "6 anos"]),
  qa("train", ["POL-BENEFICIOS §5"], "A empresa paga pós-graduação?",
    "Sim. A Lumora reembolsa 70% de cursos de graduação, pós-graduação e idiomas relacionados à função, limitado a R$ 1.000,00 por mês, com aprovação prévia do gestor e aprovação no curso.",
    ["70", "1 000"]),
  qa("train", ["POL-BENEFICIOS §6"], "Qual a cobertura do seguro de vida?",
    "O seguro de vida em grupo cobre o equivalente a 24 salários nominais do colaborador, sem custo para ele.",
    ["24 salarios"]),

  // Onboarding
  qa("train", ["PROC-ONBOARDING §2"], "O que é o buddy no onboarding?",
    "O buddy é um colega de outro time responsável por apoiar o novo colaborador durante os primeiros 90 dias.",
    ["outro time", "90 dias"]),
  qa("train", ["PROC-ONBOARDING §4"], "Até quando o gestor deve dar o feedback de fim de experiência?",
    "O feedback formal de fim de experiência deve ser dado até o 85º dia.",
    ["85"]),

  // Compras
  qa("train", ["PROC-COMPRAS §1"], "Quem aprova uma compra de R$ 20.000?",
    "Compras acima de R$ 5.000,00 e até R$ 50.000,00 exigem aprovação do diretor.",
    ["diretor"]),
  qa("train", ["PROC-COMPRAS §2"], "Quantas cotações preciso para uma compra de R$ 15 mil?",
    "Compras acima de R$ 10.000,00 exigem no mínimo 3 cotações de fornecedores diferentes, registradas no sistema Compras+.",
    ["3 cotacoes|tres cotacoes"]),
  qa("train", ["PROC-COMPRAS §5"], "Preciso de aprovação da Segurança para contratar um SaaS barato?",
    "Sim. Contratações de software e serviços de nuvem, independentemente do valor, exigem parecer prévio da área de Segurança da Informação e da área Jurídica.",
    ["seguranca da informacao", "juridica|juridico"]),

  // Conduta e ética
  qa("train", ["POL-CONDUTA §1"], "Posso aceitar um presente de um fornecedor?",
    "Sim, até R$ 200,00 por ano por parte relacionada. Acima disso, o presente deve ser recusado ou registrado no Portal de Compliance em até 5 dias úteis, e dinheiro ou vales nunca podem ser aceitos.",
    ["200"]),
  qa("train", ["POL-CONDUTA §3"], "Como faço uma denúncia de assédio?",
    "Pelo Canal de Ética, operado por empresa independente: site etica.lumora.com.br ou telefone 0800 777 4321, 24 horas por dia. A denúncia pode ser anônima.",
    ["etica lumora com br|0800 777 4321"]),

  // Suporte
  qa("train", ["MAN-SUPORTE §2"], "Qual o prazo de atendimento de um chamado de prioridade alta?",
    "Chamados de prioridade alta têm primeiro atendimento em até 4 horas.",
    ["4 horas|quatro horas"]),
  qa("train", ["MAN-SUPORTE §3"], "Esqueci minha senha e estou sem o Lumora Auth. O que faço?",
    "Ligue para o Service Desk no ramal 2000, de segunda a sexta, das 7h às 21h.",
    ["2000"]),

  // Combinação de documentos
  qa("train", ["POL-SEGURANCA §4", "MAN-SUPORTE §4"], "Perdi meu notebook: o que preciso avisar e como consigo um equipamento reserva?",
    "Reporte a perda ao SOC em até 1 hora e envie o boletim de ocorrência em até 24 horas. Para o reserva, abra chamado no Portal do Colaborador: ele é entregue em até 2 dias úteis nas capitais.",
    ["1 hora|uma hora", "24 horas", "2 dias uteis|dois dias uteis"]),
  qa("train", ["POL-HOMEOFFICE §2", "POL-BENEFICIOS §3"], "Qual a ajuda de custo do modelo híbrido e qual o valor do vale-refeição por dia?",
    "A ajuda de custo do modelo híbrido é de R$ 150,00 por mês, e o vale-refeição/alimentação é de R$ 55,00 por dia útil.",
    ["150", "55"]),

  // Fora da base (recusa)
  oob("train", "A Lumora paga PLR? Qual o valor?"),
  oob("train", "Qual o valor do vale-transporte?"),
  oob("train", "O plano de saúde da empresa cobre pets?"),
  oob("train", "Qual é o salário inicial de um desenvolvedor júnior?"),
  oob("train", "Existe bônus por indicação de candidatos?"),
  oob("train", "Qual o limite de reembolso de lavanderia em viagens longas?"),
  oob("train", "Posso levar meu cachorro para o escritório?"),
  oob("train", "Qual é o dress code do escritório?"),
  oob("train", "A empresa oferece licença sabática?"),
  oob("train", "Quanto é o auxílio-funeral pago pela empresa?"),
  oob("train", "Tem estacionamento gratuito no escritório para colaboradores?"),
  oob("train", "Em que data é pago o 13º salário?"),

  // ───────────────────────────── TESTE ─────────────────────────────
  qa("test", ["POL-FERIAS §1"], "Estagiário tem direito a férias?",
    "Estagiários têm direito a 30 dias de recesso remunerado por ano, conforme a Lei do Estágio.",
    ["30 dias", "recesso"]),
  qa("test", ["POL-FERIAS §3"], "Com quanto tempo de antecedência preciso pedir férias?",
    "A solicitação deve ser feita no RH Digital com antecedência mínima de 45 dias da data de início, e o gestor tem até 5 dias úteis para aprovar.",
    ["45 dias"]),
  qa("test", ["POL-FERIAS §6"], "Vou me casar. Quantos dias de folga eu tenho?",
    "Para casamento, você tem 5 dias de licença gala.",
    ["5 dias|cinco dias"]),
  qa("test", ["POL-HOMEOFFICE §2"], "Qual o valor da ajuda de custo para quem trabalha 100% remoto?",
    "No modelo 100% remoto, a ajuda de custo mensal é de R$ 250,00.",
    ["250"]),
  qa("test", ["POL-HOMEOFFICE §3"], "Em quanto tempo devo devolver o notebook se eu sair da empresa?",
    "Os equipamentos devem ser devolvidos em até 5 dias úteis após o desligamento.",
    ["5 dias uteis|cinco dias uteis"]),
  qa("test", ["POL-REEMBOLSO §2"], "Quando o reembolso aprovado cai na conta?",
    "Os reembolsos aprovados são pagos no dia 10 do mês seguinte, por depósito na conta-salário.",
    ["dia 10"]),
  qa("test", ["POL-REEMBOLSO §3"], "Em viagem internacional, quanto posso gastar por dia com refeições?",
    "Em viagens internacionais, o limite de alimentação é de US$ 70,00 por dia.",
    ["70"]),
  qa("test", ["POL-REEMBOLSO §4"], "Em que situação posso voar de classe executiva?",
    "Voos com duração superior a 8 horas podem ser em classe executiva, com aprovação de diretor.",
    ["8 horas|oito horas", "diretor"]),
  qa("test", ["POL-SEGURANCA §1"], "A autenticação em dois fatores é obrigatória para quais sistemas?",
    "O MFA pelo aplicativo Lumora Auth é obrigatório para e-mail, VPN e sistemas internos.",
    ["lumora auth", "vpn"]),
  qa("test", ["POL-SEGURANCA §6"], "Até quando preciso concluir o treinamento anual de segurança da informação?",
    "O treinamento anual de Segurança da Informação e LGPD deve ser concluído na Lumora Academy até 31 de março de cada ano.",
    ["31 de marco"]),
  qa("test", ["POL-BENEFICIOS §1"], "Tem coparticipação no plano de saúde?",
    "Sim: coparticipação de 20% em consultas e exames, limitada a R$ 300,00 por mês por beneficiário.",
    ["20", "300"]),
  qa("test", ["POL-BENEFICIOS §3"], "Qual o valor do vale-refeição por dia?",
    "O colaborador recebe R$ 55,00 por dia útil em vale-refeição ou vale-alimentação, no cartão Flexi.",
    ["55"]),
  qa("test", ["PROC-ONBOARDING §4"], "Quanto tempo dura o período de experiência?",
    "O contrato de experiência dura 90 dias, divididos em dois períodos de 45 dias.",
    ["90 dias", "45 dias"]),
  qa("test", ["PROC-COMPRAS §4"], "Qual o prazo de pagamento de fornecedores?",
    "O prazo padrão é de 45 dias após o recebimento da nota fiscal, com pagamentos apenas às terças e sextas-feiras.",
    ["45 dias"]),
  qa("test", ["POL-CONDUTA §1"], "Um fornecedor me ofereceu um vale-presente de R$ 100. Posso aceitar?",
    "Não. Dinheiro, vales ou equivalentes nunca podem ser aceitos, independentemente do valor.",
    ["independentemente do valor|independente do valor|qualquer valor"]),
  qa("test", ["POL-FERIAS §6", "POL-REEMBOLSO §2"], "Qual o prazo para enviar um atestado médico e para lançar um pedido de reembolso?",
    "O atestado deve ser enviado em até 48 horas após o início do afastamento, e o reembolso deve ser lançado no Despesas+ em até 30 dias corridos após a despesa.",
    ["48 horas|48h", "30 dias"]),
  oob("test", "Quantos dias de folga recebo por doação de sangue?"),
  oob("test", "Qual o limite do cartão corporativo?"),
  oob("test", "O plano de saúde cobre cirurgia bariátrica?"),
  oob("test", "Como funciona o reajuste salarial anual?")
];
