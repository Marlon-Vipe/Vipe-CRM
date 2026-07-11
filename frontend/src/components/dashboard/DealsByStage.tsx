import { useEffect, useState } from "react";
import CardBox from "src/components/shared/CardBox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "src/components/ui/table";
import { supabase } from "src/lib/supabaseClient";
import { useAuth } from "src/context/AuthContext";

interface StageSummary {
  stageId: string;
  name: string;
  count: number;
  totalValue: number;
}

const currencyFormatter = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  maximumFractionDigits: 0,
});

const DealsByStage = () => {
  const { tenantId } = useAuth();
  const [rows, setRows] = useState<StageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let isMounted = true;

    async function loadStageSummary() {
      const [{ data: stages }, { data: deals }] = await Promise.all([
        supabase
          .from("pipeline_stages")
          .select("id, name, sort_order")
          .eq("tenant_id", tenantId)
          .order("sort_order"),
        supabase.from("deals").select("stage_id, value_estimate").eq("tenant_id", tenantId),
      ]);

      if (!isMounted) return;

      const summary: StageSummary[] = (stages || []).map((stage) => {
        const dealsInStage = (deals || []).filter((deal) => deal.stage_id === stage.id);
        const totalValue = dealsInStage.reduce((sum, deal) => sum + (deal.value_estimate || 0), 0);
        return { stageId: stage.id, name: stage.name, count: dealsInStage.length, totalValue };
      });

      setRows(summary);
      setLoading(false);
    }

    loadStageSummary();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return (
    <CardBox className="h-full">
      <h5 className="text-lg font-semibold mb-4">Negociaciones por etapa</h5>
      {!loading && rows.length === 0 ? (
        <p className="opacity-70 text-sm">Todavía no hay negociaciones registradas.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-center">Negociaciones</TableHead>
              <TableHead className="text-right">Valor estimado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.stageId}>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-center">{row.count}</TableCell>
                <TableCell className="text-right">{currencyFormatter.format(row.totalValue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardBox>
  );
};

export default DealsByStage;
