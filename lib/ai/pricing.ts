import type { ChatModel } from "./models";

export type ModelPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
};

/**
 * Moonshot-direct models bypass Vercel AI Gateway, so their pricing isn't
 * available from the Gateway's live pricing endpoint below. Manually
 * maintained from https://platform.kimi.ai/docs/pricing — re-verify there
 * if these numbers look stale.
 */
const MOONSHOT_PRICING: Record<string, ModelPricing> = {
  "kimi-k2.6": { inputPerMillion: 0.95, outputPerMillion: 4 },
  "kimi-k2.7-code": { inputPerMillion: 0.95, outputPerMillion: 4 },
  "kimi-k2.7-code-highspeed": { inputPerMillion: 0.95, outputPerMillion: 8 },
  "kimi-k3": { inputPerMillion: 3, outputPerMillion: 15 },
};

const GATEWAY_PRICING_REVALIDATE_SECONDS = 86_400;

type GatewayModel = {
  id: string;
  pricing?: { input?: string | number; output?: string | number };
};

let gatewayPricingCache: {
  data: Record<string, ModelPricing>;
  expiresAt: number;
} | null = null;

async function getGatewayPricing(): Promise<Record<string, ModelPricing>> {
  if (gatewayPricingCache && gatewayPricingCache.expiresAt > Date.now()) {
    return gatewayPricingCache.data;
  }

  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      next: { revalidate: GATEWAY_PRICING_REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      return {};
    }

    const json = await res.json();
    const data: Record<string, ModelPricing> = {};

    for (const model of (json.data ?? []) as GatewayModel[]) {
      const input = Number(model.pricing?.input);
      const output = Number(model.pricing?.output);

      if (Number.isFinite(input) && Number.isFinite(output)) {
        data[model.id] = {
          inputPerMillion: input * 1_000_000,
          outputPerMillion: output * 1_000_000,
        };
      }
    }

    gatewayPricingCache = {
      data,
      expiresAt: Date.now() + GATEWAY_PRICING_REVALIDATE_SECONDS * 1000,
    };

    return data;
  } catch {
    return {};
  }
}

export async function getModelPricing(
  model: ChatModel
): Promise<ModelPricing | null> {
  if (model.directProvider === "moonshot") {
    return MOONSHOT_PRICING[model.providerModelId ?? ""] ?? null;
  }

  const gatewayPricing = await getGatewayPricing();
  return gatewayPricing[model.id] ?? null;
}

export function estimateCost(
  pricing: ModelPricing | null,
  inputTokens: number,
  outputTokens: number
): number | null {
  if (!pricing) {
    return null;
  }

  return (
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion
  );
}
