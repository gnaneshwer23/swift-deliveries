import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { operatorAllowed } from "@/lib/pilot/enquiry.functions";

export const listComparisonReviews = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (!(await operatorAllowed(context.db, context.userId, context.userEmail)))
      throw new Error("Not authorised.");
    const { neonTransaction } = await import("@/lib/db/neon.server");
    return neonTransaction(async (_db, query) => {
      const rows = await query(
        `select r.mission_id,r.workspace_id,r.spend_key,r.status,r.units,r.updated_at
        from psi_comparison_reservations r
        where r.status in ('reserved','uncertain') and not exists (
          select 1 from psi_comparison_reconciliations c where c.mission_id=r.mission_id and c.spend_key=r.spend_key
        ) order by r.updated_at asc limit 100`,
        [],
      );
      return rows.map((row) => ({
        missionId: String(row["mission_id"]),
        workspaceId: String(row["workspace_id"]),
        spendKey: String(row["spend_key"]),
        status: String(row["status"]),
        units: Number(row["units"]),
        updatedAt: String(row["updated_at"]),
      }));
    });
  });

export const resolveComparisonReview = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        missionId: z.string().uuid(),
        spendKey: z.string().min(1).max(200),
        outcome: z.enum(["charged", "not_dispatched"]),
        evidenceNote: z.string().trim().min(20).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const authorised = await operatorAllowed(context.db, context.userId, context.userEmail);
    const { reconcileComparison } = await import("./reconciliation.server");
    return reconcileComparison(data, { authorised, id: context.userId });
  });
