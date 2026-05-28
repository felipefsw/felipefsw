import Anthropic from "@anthropic-ai/sdk";

// Cliente do Claude. Lê ANTHROPIC_API_KEY do ambiente.
// O construtor pode ser chamado sem args — o SDK já procura a env var por padrão,
// mas instanciamos explicitamente para falhar cedo (no servidor) se faltar.
let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não definida. Configure a variável de ambiente no Vercel/local."
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export type ExecucaoResultado = {
  texto: string;
  modelo: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreate: number;
  cacheRead: number;
  duracaoMs: number;
};

// Executa um agente: envia o System Prompt (com prompt caching ephemeral) +
// a entrada do usuário, e devolve a resposta em texto (Markdown).
//
// O System Prompt é colocado dentro de um bloco `text` com `cache_control` —
// a partir do segundo request com o mesmo prompt, o Claude cobra ~10% do preço
// dos tokens cacheados. A entrada do usuário (que muda a cada auditoria) fica
// depois, fora do cache.
export async function executarAgente(args: {
  systemPrompt: string;
  entrada: string;
  modelo?: string;
  maxTokens?: number;
}): Promise<ExecucaoResultado> {
  const modelo = args.modelo || "claude-opus-4-7";
  const maxTokens = args.maxTokens ?? 16000;
  const inicio = Date.now();

  const resposta = await client().messages.create({
    model: modelo,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: args.systemPrompt,
        // Cache de 5 min. Prompts < 1024 tokens não são cacheados (silenciosamente).
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: args.entrada }],
  });

  const texto = resposta.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    texto,
    modelo: resposta.model,
    inputTokens: resposta.usage.input_tokens,
    outputTokens: resposta.usage.output_tokens,
    cacheCreate: resposta.usage.cache_creation_input_tokens ?? 0,
    cacheRead: resposta.usage.cache_read_input_tokens ?? 0,
    duracaoMs: Date.now() - inicio,
  };
}
