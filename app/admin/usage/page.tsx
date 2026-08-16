import { getUsageSummary } from "@/lib/db/queries";

type ModelBreakdown = {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  requestCount: number;
  hasUnpriced: boolean;
};

type UserSummary = {
  userId: string;
  email: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  requestCount: number;
  lastUsedAt: string;
  hasUnpriced: boolean;
  models: ModelBreakdown[];
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatTokens(value: number): string {
  return value.toLocaleString();
}

function formatCost(value: number, hasUnpriced: boolean): string {
  const formatted = `$${value.toFixed(4)}`;
  return hasUnpriced ? `${formatted}+` : formatted;
}

export default async function AdminUsagePage() {
  const rows = await getUsageSummary();

  const byUser = new Map<string, UserSummary>();

  for (const row of rows) {
    const inputTokens = toNumber(row.inputTokens);
    const outputTokens = toNumber(row.outputTokens);
    const costUsd = toNumber(row.estimatedCostUsd);
    const requestCount = toNumber(row.requestCount);
    const hasUnpriced = toNumber(row.unpricedCount) > 0;

    const existing = byUser.get(row.userId) ?? {
      costUsd: 0,
      email: row.email,
      hasUnpriced: false,
      inputTokens: 0,
      lastUsedAt: row.lastUsedAt,
      models: [],
      outputTokens: 0,
      requestCount: 0,
      userId: row.userId,
    };

    existing.inputTokens += inputTokens;
    existing.outputTokens += outputTokens;
    existing.costUsd += costUsd;
    existing.requestCount += requestCount;
    existing.hasUnpriced = existing.hasUnpriced || hasUnpriced;
    if (row.lastUsedAt > existing.lastUsedAt) {
      existing.lastUsedAt = row.lastUsedAt;
    }
    existing.models.push({
      costUsd,
      hasUnpriced,
      inputTokens,
      modelId: row.modelId,
      outputTokens,
      requestCount,
    });

    byUser.set(row.userId, existing);
  }

  const summaries = [...byUser.values()].sort((a, b) => b.costUsd - a.costUsd);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-medium text-base">Usage</h2>
        <p className="text-muted-foreground text-sm">
          Estimated token usage and cost per user. A "+" means at least one
          request used a model without known pricing, so the real total is
          higher than shown.
        </p>
      </div>

      {summaries.length === 0 ? (
        <p className="text-muted-foreground text-sm">No usage recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {summaries.map((s) => (
            <div
              className="overflow-hidden rounded-lg border border-border/50"
              key={s.userId}
            >
              <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
                <div>
                  <p className="font-medium text-sm">{s.email}</p>
                  <p className="text-muted-foreground text-xs">
                    Last used {new Date(s.lastUsedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {formatCost(s.costUsd, s.hasUnpriced)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {s.requestCount} requests
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-normal">Model</th>
                    <th className="px-4 py-2 font-normal">Input tokens</th>
                    <th className="px-4 py-2 font-normal">Output tokens</th>
                    <th className="px-4 py-2 font-normal">Requests</th>
                    <th className="px-4 py-2 font-normal">Est. cost</th>
                  </tr>
                </thead>
                <tbody>
                  {s.models.map((m) => (
                    <tr
                      className="border-border/50 border-t"
                      key={`${s.userId}-${m.modelId}`}
                    >
                      <td className="px-4 py-2">{m.modelId}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {formatTokens(m.inputTokens)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {formatTokens(m.outputTokens)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {m.requestCount}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {formatCost(m.costUsd, m.hasUnpriced)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
