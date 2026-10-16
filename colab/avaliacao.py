"""Avaliação quantitativa do Assistente de Conhecimento Interno.

Compara as respostas de cada modo (modelo base / fine-tunado, com / sem grounding) no conjunto de
teste e mede: acurácia factual, citação da fonte, recusa correta fora da base, falsa recusa e
alucinação. Só usa a biblioteca padrão: roda no Colab (importado pelo notebook) ou localmente:

    python colab/avaliacao.py predictions.jsonl --report docs/relatorio-avaliacao.md

Cada linha de `predictions.jsonl` tem: id, category, mode, question, context, reference,
sources (lista de IDs), must_include (lista de fatos) e prediction (texto gerado).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import OrderedDict

MODES = OrderedDict([
    ("base_sem_grounding", "Base, sem grounding"),
    ("base_com_grounding", "Base, com grounding (só prompt)"),
    ("ft_com_grounding", "Fine-tunado, com grounding"),
    ("ft_sem_grounding", "Fine-tunado, sem grounding"),
])

CATEGORIES = OrderedDict([
    ("answerable", "Na base"),
    ("multi_doc", "Multi-documento"),
    ("out_of_base", "Fora da base"),
])

# Expressões de recusa / "não está na base" (comparadas na forma canônica, sem acentos).
REFUSAL_PATTERNS = [
    "nao encontrei", "nao consta", "nao constam", "nao ha informac", "nao possuo informac",
    "nao tenho informac", "nao tenho acesso", "nao existe informac", "nao ha mencao", "nao e mencionad",
    "nao sao mencionad", "nao esta nos documentos", "nao estao nos documentos", "documentos nao trazem",
    "documentos nao mencionam", "documentos nao informam", "documentos nao especificam",
    "documentos fornecidos nao", "nao ha dados", "nao foi possivel encontrar", "nao disponho",
]

ID_RE = re.compile(r"\[([A-Z]+-[A-Z]+)\]")
LIST_MARKER_RE = re.compile(r"^\s*\d+[.)]\s+", re.MULTILINE)


def canonical(text: str) -> str:
    """Mesma regra de `canonical()` em src/text.ts: sem acentos, minúsculo, só letras/dígitos."""
    text = re.sub("[ºª°]", " ", text)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def has_fact(text: str, fact: str) -> bool:
    """O fato (ou uma de suas alternativas "a|b") aparece como sequência de palavras inteiras."""
    haystack = f" {canonical(text)} "
    return any(f" {canonical(alt)} " in haystack for alt in fact.split("|") if alt.strip())


def is_refusal(text: str) -> bool:
    norm = canonical(text)
    return any(p in norm for p in REFUSAL_PATTERNS)


def cited_ids(text: str) -> set[str]:
    return set(ID_RE.findall(text))


def numbers(text: str) -> set[str]:
    text = ID_RE.sub(" ", LIST_MARKER_RE.sub(" ", text))
    return set(re.findall(r"\d+", canonical(text)))


def score_item(row: dict) -> dict:
    """Métricas de uma resposta. A referência factual é o contexto recuperado (que contém a fonte)."""
    pred = row.get("prediction", "") or ""
    refused = is_refusal(pred)
    context_ids = cited_ids(row.get("context", ""))
    unsupported = sorted(numbers(pred) - numbers(row.get("context", "") + " " + row.get("question", "")))
    invalid_citations = sorted(cited_ids(pred) - context_ids)
    result = {
        "id": row["id"],
        "category": row["category"],
        "mode": row["mode"],
        "refused": refused,
        "unsupported_numbers": unsupported,
        "invalid_citations": invalid_citations,
    }
    if row["category"] == "out_of_base":
        result["correct_refusal"] = refused
        # Fora da base, qualquer resposta que não seja recusa é conteúdo inventado.
        result["hallucinated"] = not refused
        return result

    facts = row.get("must_include", [])
    hits = sum(1 for f in facts if has_fact(pred, f))
    recall = hits / len(facts) if facts else 0.0
    result.update({
        "fact_recall": recall,
        "all_facts": bool(facts) and hits == len(facts),
        "citation_ok": set(row.get("sources", [])) <= cited_ids(pred),
        "has_source_line": bool(re.search(r"(?im)^\s*\**fonte", pred)),
        "false_refusal": refused and hits == 0,
        # Na base, alucinação = afirmar número que não está no contexto ou citar documento que não estava lá.
        "hallucinated": bool(unsupported) or bool(invalid_citations),
    })
    return result


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def summarize(predictions: list[dict]) -> "OrderedDict[str, dict]":
    """Métricas agregadas por modo (na ordem de MODES; modos desconhecidos vão ao fim)."""
    scored = [score_item(r) for r in predictions]
    modes = [m for m in MODES if any(s["mode"] == m for s in scored)]
    modes += sorted({s["mode"] for s in scored} - set(modes))
    summary: OrderedDict[str, dict] = OrderedDict()
    for mode in modes:
        items = [s for s in scored if s["mode"] == mode]
        ans = [s for s in items if s["category"] != "out_of_base"]
        oob = [s for s in items if s["category"] == "out_of_base"]
        m = {
            "n": len(items),
            "acuracia_factual": _mean([s["fact_recall"] for s in ans]),
            "respostas_completas": _mean([float(s["all_facts"]) for s in ans]),
            "citacao_correta": _mean([float(s["citation_ok"]) for s in ans]),
            "recusa_correta": _mean([float(s["correct_refusal"]) for s in oob]),
            "falsa_recusa": _mean([float(s["false_refusal"]) for s in ans]),
            "taxa_alucinacao": _mean([float(s["hallucinated"]) for s in items]),
        }
        m["score_geral"] = _mean([m["acuracia_factual"], m["citacao_correta"], m["recusa_correta"], 1 - m["taxa_alucinacao"]])
        m["por_categoria"] = OrderedDict()
        for cat in CATEGORIES:
            cat_items = [s for s in items if s["category"] == cat]
            if not cat_items:
                continue
            if cat == "out_of_base":
                m["por_categoria"][cat] = {"n": len(cat_items), "recusa_correta": _mean([float(s["correct_refusal"]) for s in cat_items])}
            else:
                m["por_categoria"][cat] = {
                    "n": len(cat_items),
                    "acuracia_factual": _mean([s["fact_recall"] for s in cat_items]),
                    "citacao_correta": _mean([float(s["citation_ok"]) for s in cat_items]),
                }
        m["itens"] = items
        summary[mode] = m
    return summary


METRICS = [
    ("acuracia_factual", "Acurácia factual ↑"),
    ("respostas_completas", "Respostas completas ↑"),
    ("citacao_correta", "Citação correta ↑"),
    ("recusa_correta", "Recusa fora da base ↑"),
    ("falsa_recusa", "Falsa recusa ↓"),
    ("taxa_alucinacao", "Alucinação ↓"),
    ("score_geral", "Score geral ↑"),
]


def _pct(v: float) -> str:
    return f"{v * 100:.1f}%"


def render_table(summary: dict) -> str:
    head = "| Modo | " + " | ".join(label for _, label in METRICS) + " |"
    sep = "|---" * (len(METRICS) + 1) + "|"
    rows = [f"| {MODES.get(mode, mode)} | " + " | ".join(_pct(m[key]) for key, _ in METRICS) + " |" for mode, m in summary.items()]
    return "\n".join([head, sep, *rows])


def _delta(summary: dict, a: str, b: str) -> list[str]:
    if a not in summary or b not in summary:
        return []
    lines = [f"**{MODES.get(b, b)}** em relação a **{MODES.get(a, a)}**:", ""]
    for key, label in METRICS:
        diff = (summary[b][key] - summary[a][key]) * 100
        lines.append(f"- {label}: {_pct(summary[a][key])} → {_pct(summary[b][key])} ({diff:+.1f} p.p.)")
    return lines + [""]


def render_report(predictions: list[dict], title: str = "Relatório de avaliação") -> str:
    summary = summarize(predictions)
    by_key = {(r["id"], r["mode"]): r for r in predictions}
    ids = list(OrderedDict.fromkeys(r["id"] for r in predictions))
    out = [
        f"# {title}",
        "",
        "> Gerado por `colab/avaliacao.py` a partir das respostas reais dos modelos no conjunto de teste.",
        "",
        "## Resumo",
        "",
        render_table(summary),
        "",
        "## Comparações-chave",
        "",
        *_delta(summary, "base_sem_grounding", "base_com_grounding"),
        *_delta(summary, "base_com_grounding", "ft_com_grounding"),
        *_delta(summary, "base_sem_grounding", "ft_com_grounding"),
        *_delta(summary, "ft_com_grounding", "ft_sem_grounding"),
        "## Por categoria",
        "",
        "| Modo | " + " | ".join(CATEGORIES[c] for c in CATEGORIES) + " |",
        "|---" * (len(CATEGORIES) + 1) + "|",
    ]
    for mode, m in summary.items():
        cells = []
        for cat in CATEGORIES:
            c = m["por_categoria"].get(cat)
            if not c:
                cells.append("—")
            elif cat == "out_of_base":
                cells.append(f"recusa {_pct(c['recusa_correta'])} (n={c['n']})")
            else:
                cells.append(f"fatos {_pct(c['acuracia_factual'])} · citação {_pct(c['citacao_correta'])} (n={c['n']})")
        out.append(f"| {MODES.get(mode, mode)} | " + " | ".join(cells) + " |")

    out += ["", "## Resultado por pergunta", "", "Legenda: ✅ correto · ❌ errado · ⚠️ alucinação (número fora do contexto, citação inventada ou resposta fora da base).", ""]
    modes = list(summary)
    out.append("| ID | Categoria | " + " | ".join(MODES.get(m, m) for m in modes) + " |")
    out.append("|---" * (len(modes) + 2) + "|")
    scored = {(s["id"], s["mode"]): s for m in summary.values() for s in m["itens"]}
    for id_ in ids:
        cells = []
        for mode in modes:
            s = scored.get((id_, mode))
            if not s:
                cells.append("—")
                continue
            if s["category"] == "out_of_base":
                mark = "✅ recusou" if s["correct_refusal"] else "❌ respondeu"
            else:
                mark = f"{'✅' if s['all_facts'] else '❌'} fatos {s['fact_recall'] * 100:.0f}%{' · fonte ✅' if s['citation_ok'] else ''}"
            if s["hallucinated"]:
                mark += " ⚠️"
            cells.append(mark)
        category = next(s["category"] for s in scored.values() if s["id"] == id_)
        out.append(f"| {id_} | {CATEGORIES.get(category, category)} | " + " | ".join(cells) + " |")

    out += ["", "## Exemplos de respostas", ""]
    sample = [i for i in ids if by_key.get((i, modes[0]), {}).get("category") != "out_of_base"][:3]
    sample += [i for i in ids if by_key.get((i, modes[0]), {}).get("category") == "out_of_base"][:2]
    for id_ in sample:
        first = next(r for r in predictions if r["id"] == id_)
        out += [f"### {id_} — {first['question']}", "", "**Referência:**", "", *[f"> {l}" for l in first["reference"].splitlines()], ""]
        for mode in modes:
            r = by_key.get((id_, mode))
            if r:
                out += [f"**{MODES.get(mode, mode)}:**", "", *[f"> {l}" for l in (r["prediction"] or "(vazio)").splitlines()], ""]

    out += [
        "## Definição das métricas",
        "",
        "- **Acurácia factual**: média, nas perguntas da base, da fração de fatos obrigatórios (`must_include`) presentes na resposta.",
        "- **Respostas completas**: % de perguntas da base com todos os fatos obrigatórios.",
        "- **Citação correta**: % de perguntas da base em que a resposta cita o(s) ID(s) do(s) documento(s)-fonte, ex.: `[POL-FERIAS]`.",
        "- **Recusa fora da base**: % de perguntas fora da base respondidas com recusa (\"não encontrei…\").",
        "- **Falsa recusa**: % de perguntas da base recusadas sem trazer nenhum fato.",
        "- **Alucinação**: % de respostas que inventam conteúdo — fora da base, qualquer resposta que não seja recusa; na base, "
        "afirmar número ausente do contexto/pergunta ou citar documento que não estava no contexto.",
        "- **Score geral**: média de acurácia factual, citação correta, recusa fora da base e (1 − alucinação).",
        "",
    ]
    return "\n".join(out)


def load_jsonl(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def save_jsonl(rows: list[dict], path: str) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Avaliação quantitativa: base x fine-tunado, com x sem grounding.")
    parser.add_argument("predictions", help="arquivo .jsonl gerado pelo notebook")
    parser.add_argument("--report", help="grava o relatório completo em Markdown neste caminho")
    parser.add_argument("--title", default="Relatório de avaliação")
    args = parser.parse_args(argv)

    predictions = load_jsonl(args.predictions)
    print(render_table(summarize(predictions)))
    if args.report:
        with open(args.report, "w", encoding="utf-8") as fh:
            fh.write(render_report(predictions, args.title))
        print(f"\nRelatório gravado em {args.report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
