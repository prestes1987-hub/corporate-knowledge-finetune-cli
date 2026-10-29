import { REFUSAL, SYSTEM_GROUNDED, SYSTEM_UNGROUNDED } from "../context.ts";

/**
 * Gera colab/finetune_qlora_limpo.ipynb (versão sem saídas, para rodar do zero). As células Python ficam aqui (String.raw, sem escapes) e as
 * constantes da estrutura de contexto são injetadas de src/context.ts — o notebook nunca diverge
 * do prompt usado no dataset e na CLI.
 */

type Cell = { type: "markdown" | "code"; source: string };

/** Em String.raw, "\`" mantém a barra; no Markdown queremos só a crase. */
const md = (source: string): Cell => ({ type: "markdown", source: source.trim().replace(/\\`/g, "`") });
const code = (source: string): Cell => ({ type: "code", source: source.trim() });

/** Literal de string Python: JSON é um subconjunto válido para strings. */
const py = (value: string) => JSON.stringify(value);

export const BASE_MODEL = "Qwen/Qwen2.5-1.5B-Instruct";

export function notebookCells(): Cell[] {
  return [
    md(String.raw`
# Assistente de Conhecimento Interno — fine-tuning QLoRA + LoRA

Micro-capstone: um modelo pequeno (**${BASE_MODEL}**, 4-bit) aprende a **responder só com base nos documentos internos
fornecidos no contexto**, citar a fonte e **recusar quando a base não cobre a pergunta**.

O conhecimento continua nos documentos (grounding/RAG); o fine-tuning ensina o **comportamento**. Por que essa divisão é a
escolha certa está em \`docs/justificativa.md\`.

**Fluxo**

1. Carrega o dataset (\`train.parquet\` — 50 exemplos, \`test.parquet\` — 20 exemplos), gerado por \`npm run build-dataset\`.
2. **Baseline**: modelo base no teste, **sem grounding** (só a pergunta) e **com grounding** (documentos no prompt).
3. Fine-tuning **QLoRA** (base congelada em 4-bit NF4) + **LoRA** (adaptadores treináveis nas projeções de atenção).
4. Avaliação do modelo fine-tunado, com e sem grounding, e relatório comparativo com \`avaliacao.py\`.

**Ambiente:** Colab com GPU **T4** (Ambiente de execução → Alterar o tipo de ambiente de execução → T4 GPU). Tempo total ≈ 15–20 min.
`),
    code(String.raw`!pip install -q -U transformers peft trl datasets accelerate bitsandbytes`),

    md(String.raw`
## 1. Arquivos do projeto

Envie \`dataset/train.parquet\`, \`dataset/test.parquet\` e \`colab/avaliacao.py\` (a célula só pede o que estiver faltando).
`),
    code(String.raw`
import os

NEEDED = ["train.parquet", "test.parquet", "avaliacao.py"]
missing = [f for f in NEEDED if not os.path.exists(f)]
if missing:
    from google.colab import files
    print("Envie os arquivos:", ", ".join(missing))
    files.upload()
print({f: os.path.exists(f) for f in NEEDED})
`),
    code(String.raw`
import json
import pandas as pd
from datasets import Dataset

train_df = pd.read_parquet("train.parquet")
test_df = pd.read_parquet("test.parquet")
print("treino:", len(train_df), train_df["category"].value_counts().to_dict())
print("teste: ", len(test_df), test_df["category"].value_counts().to_dict())
train_df[["id", "category", "question", "answer"]].head(8)
`),

    md(String.raw`
## 2. Estrutura de contexto

Mesmos textos de \`src/context.ts\` (injetados pelo gerador do notebook). No modo **com grounding**, a mensagem do usuário
já vem pronta na coluna \`prompt\`: \`<documentos>\` com os 3 trechos recuperados (cada um com \`[ID]\` do documento) e
\`<pergunta>\`. No modo **sem grounding**, o modelo recebe só a pergunta.
`),
    code(String.raw`
SYSTEM_GROUNDED = ${py(SYSTEM_GROUNDED)}

SYSTEM_UNGROUNDED = ${py(SYSTEM_UNGROUNDED)}

REFUSAL = ${py(REFUSAL)}


def messages_for(row, grounded: bool):
    if grounded:
        return [{"role": "system", "content": SYSTEM_GROUNDED}, {"role": "user", "content": row["prompt"]}]
    return [{"role": "system", "content": SYSTEM_UNGROUNDED}, {"role": "user", "content": row["question"]}]


example = test_df.iloc[0]
print(SYSTEM_GROUNDED, "\n\n---\n")
print(messages_for(example, grounded=True)[1]["content"])
`),

    md(String.raw`
## 3. Modelo base quantizado (QLoRA: 4-bit NF4)
`),
    code(String.raw`
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

MODEL_ID = ${py(BASE_MODEL)}

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.float16,
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
# dtype fp16 explícito: a T4 não tem bf16, e o transformers recente carregaria o Qwen em bf16 por padrão.
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID, quantization_config=bnb_config, dtype=torch.float16, device_map="auto"
)
model.eval()
print(f"Memória da GPU: {torch.cuda.memory_allocated() / 1e9:.2f} GB")
`),
    code(String.raw`
from tqdm.auto import tqdm


def ask(_model, messages, max_new_tokens: int = 200) -> str:
    inputs = tokenizer.apply_chat_template(
        messages, add_generation_prompt=True, return_tensors="pt", return_dict=True
    ).to(_model.device)
    with torch.no_grad():
        output = _model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )
    return tokenizer.decode(output[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True).strip()


def predict(_model, df, mode: str, grounded: bool) -> list[dict]:
    rows = []
    for _, row in tqdm(df.iterrows(), total=len(df), desc=mode):
        rows.append({
            "id": row["id"],
            "category": row["category"],
            "mode": mode,
            "question": row["question"],
            "context": row["context"],
            "reference": row["answer"],
            "sources": json.loads(row["sources"]),
            "must_include": json.loads(row["must_include"]),
            "prediction": ask(_model, messages_for(row, grounded)),
        })
    return rows
`),

    md(String.raw`
## 4. Baseline (modelo base, antes do fine-tuning)

- **sem grounding**: o que um chatbot genérico responderia sobre as políticas da Lumora (espera-se alucinação: o modelo não conhece a empresa);
- **com grounding**: os mesmos documentos no prompt, sem treino — mede quanto só o prompt resolve.
`),
    code(String.raw`
import avaliacao

baseline = predict(model, test_df, "base_sem_grounding", grounded=False)
baseline += predict(model, test_df, "base_com_grounding", grounded=True)
avaliacao.save_jsonl(baseline, "baseline_predictions.jsonl")

print(avaliacao.render_table(avaliacao.summarize(baseline)))
`),
    code(String.raw`
# Algumas respostas da baseline lado a lado
by_mode = {(r["id"], r["mode"]): r for r in baseline}
for id_ in ["te-04", "te-15", "te-17", "te-19"]:
    sem, com = by_mode[(id_, "base_sem_grounding")], by_mode[(id_, "base_com_grounding")]
    print(f"### {id_} [{sem['category']}] {sem['question']}")
    print("REFERÊNCIA:", sem["reference"])
    print("SEM GROUNDING:", sem["prediction"])
    print("COM GROUNDING:", com["prediction"], "\n")
`),

    md(String.raw`
## 5. Dataset de treino (prompt → completion)

Formato conversacional *prompt-completion* do TRL: o **prompt** é exatamente o que o modelo vê em produção (system + documentos +
pergunta) e a **completion** é a resposta-alvo. A loss é calculada só na completion — o modelo não "decora" os documentos,
aprende a **responder a partir deles**.
`),
    code(String.raw`
def to_prompt_completion(row):
    return {
        "prompt": messages_for(row, grounded=True),
        "completion": [{"role": "assistant", "content": row["answer"]}],
    }


train_ds = Dataset.from_pandas(train_df, preserve_index=False)
train_ds = train_ds.map(to_prompt_completion, remove_columns=train_ds.column_names)
lengths = [len(tokenizer.apply_chat_template(r["prompt"] + r["completion"])) for r in train_ds]
print(f"{len(train_ds)} exemplos | tokens por exemplo: média {sum(lengths) / len(lengths):.0f}, máx {max(lengths)}")
train_ds[0]["completion"]
`),

    md(String.raw`
## 6. LoRA sobre o modelo 4-bit (QLoRA)

- Pesos da base congelados em 4-bit; só os adaptadores LoRA (rank 16) são treinados — menos de 1% dos parâmetros.
- Adaptadores nas 4 projeções de atenção (\`q_proj\`, \`k_proj\`, \`v_proj\`, \`o_proj\`).
`),
    code(String.raw`
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

model = prepare_model_for_kbit_training(model)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
`),
    code(String.raw`
from trl import SFTConfig, SFTTrainer

trainer = SFTTrainer(
    model=model,
    train_dataset=train_ds,
    processing_class=tokenizer,
    args=SFTConfig(
        output_dir="./lora-output",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=1,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_steps=3,
        max_length=1536,
        completion_only_loss=True,
        logging_steps=2,
        save_strategy="no",
        fp16=True,
        report_to="none",
        seed=42,
    ),
)

# O SFTTrainer converte os adaptadores de modelos quantizados para bf16 ao ser criado. A T4 não tem
# bf16 e o GradScaler do fp16 não aceita gradientes bf16, então eles voltam para fp32 antes do treino.
for param in trainer.model.parameters():
    if param.requires_grad:
        param.data = param.data.float()
print("dtype dos adaptadores:", {p.dtype for p in trainer.model.parameters() if p.requires_grad})

trainer.train()
trainer.save_model("./lora-adapter")
print([round(h["loss"], 3) for h in trainer.state.log_history if "loss" in h])
`),
    code(String.raw`
import shutil
from google.colab import files

shutil.make_archive("lora-adapter", "zip", "./lora-adapter")
files.download("lora-adapter.zip")
`),

    md(String.raw`
## 7. Avaliação do modelo fine-tunado

- **com grounding**: o cenário de produção (busca + modelo fine-tunado);
- **sem grounding**: o fine-tunado sozinho — mostra que o fine-tuning **não substitui** a base de conhecimento.
`),
    code(String.raw`
model.gradient_checkpointing_disable()
model.config.use_cache = True
model.eval()

tuned = predict(model, test_df, "ft_com_grounding", grounded=True)
tuned += predict(model, test_df, "ft_sem_grounding", grounded=False)

predictions = baseline + tuned
avaliacao.save_jsonl(predictions, "predictions.jsonl")
print(avaliacao.render_table(avaliacao.summarize(predictions)))
`),
    code(String.raw`
from IPython.display import Markdown, display

report = avaliacao.render_report(predictions, "Relatório de avaliação — base x fine-tunado, com x sem grounding")
with open("relatorio-avaliacao.md", "w", encoding="utf-8") as fh:
    fh.write(report)
display(Markdown(report))
`),
    code(String.raw`
def compare(id_: str):
    """Base x fine-tunado na mesma pergunta, ambos com grounding (o adaptador é desligado para a base)."""
    row = test_df[test_df["id"] == id_].iloc[0]
    with model.disable_adapter():
        base = ask(model, messages_for(row, grounded=True))
    tuned_answer = ask(model, messages_for(row, grounded=True))
    print(f"[{row['category']}] {row['question']}\n")
    print("BASE:      ", base, "\n")
    print("FINE-TUNED:", tuned_answer, "\n")
    print("REFERÊNCIA:", row["answer"])


compare("te-18")
`),
    code(String.raw`
files.download("predictions.jsonl")
files.download("relatorio-avaliacao.md")
`),

    md(String.raw`
## 8. Próximos passos

- Copie \`predictions.jsonl\` para \`dataset/\` e \`relatorio-avaliacao.md\` para \`docs/\` no projeto; para regerar o relatório:
  \`python colab/avaliacao.py dataset/predictions.jsonl --report docs/relatorio-avaliacao.md\`.
- Para servir em produção: \`model.merge_and_unload()\` (sobre a base em fp16) → exportar para GGUF/Ollama ou vLLM e apontar a
  CLI para o endpoint (\`LLM_BASE_URL\`/\`LLM_MODEL\` no \`.env\`). Os documentos continuam fora do modelo: atualizar uma política
  é reindexar, não retreinar.
`)
  ];
}

export function buildNotebook(): string {
  const toLines = (source: string) => {
    const lines = source.split("\n");
    return lines.map((line, i) => (i < lines.length - 1 ? `${line}\n` : line));
  };
  const notebook = {
    nbformat: 4,
    nbformat_minor: 0,
    metadata: {
      colab: { provenance: [], gpuType: "T4" },
      kernelspec: { name: "python3", display_name: "Python 3" },
      language_info: { name: "python" },
      accelerator: "GPU"
    },
    cells: notebookCells().map((cell) => cell.type === "markdown"
      ? { cell_type: "markdown", metadata: {}, source: toLines(cell.source) }
      : { cell_type: "code", metadata: {}, execution_count: null, outputs: [], source: toLines(cell.source) })
  };
  return JSON.stringify(notebook, null, 1) + "\n";
}
