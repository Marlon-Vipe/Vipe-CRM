import { useEffect, useState } from "react";

// @mui material components
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React examples
import Table from "examples/Tables/Table";

// CRM Inmobiliario
import { supabase } from "lib/supabaseClient";
import { useAuth } from "context/AuthContext";

const currencyFormatter = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  maximumFractionDigits: 0,
});

function DealsByStage() {
  const { tenantId } = useAuth();
  const [rows, setRows] = useState([]);
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

      const summary = (stages || []).map((stage) => {
        const dealsInStage = (deals || []).filter((deal) => deal.stage_id === stage.id);
        const totalValue = dealsInStage.reduce((sum, deal) => sum + (deal.value_estimate || 0), 0);
        return {
          etapa: stage.name,
          negociaciones: String(dealsInStage.length),
          "valor estimado": currencyFormatter.format(totalValue),
        };
      });

      setRows(summary);
      setLoading(false);
    }

    loadStageSummary();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const columns = [
    { name: "etapa", align: "left" },
    { name: "negociaciones", align: "center" },
    { name: "valor estimado", align: "right" },
  ];

  return (
    <Card className="h-100">
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
        <SoftTypography variant="h6" gutterBottom>
          Negociaciones por etapa
        </SoftTypography>
      </SoftBox>
      {!loading && rows.length === 0 ? (
        <SoftBox px={3} pb={3}>
          <SoftTypography variant="button" color="text">
            Todavía no hay negociaciones registradas.
          </SoftTypography>
        </SoftBox>
      ) : (
        <SoftBox
          sx={{
            "& .MuiTableRow-root:not(:last-child)": {
              "& td": {
                borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                  `${borderWidth[1]} solid ${borderColor}`,
              },
            },
          }}
        >
          <Table columns={columns} rows={rows} />
        </SoftBox>
      )}
    </Card>
  );
}

export default DealsByStage;
