import { useEffect, useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";

// Soft UI Dashboard React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";

// Dashboard layout components
import DealsByStage from "layouts/dashboard/components/DealsByStage";
import UpcomingActivities from "layouts/dashboard/components/UpcomingActivities";

// CRM Inmobiliario
import { supabase } from "lib/supabaseClient";
import { useAuth } from "context/AuthContext";

const INITIAL_KPIS = {
  newLeads: null,
  activeProperties: null,
  openDeals: null,
  pendingActivities: null,
};

function Dashboard() {
  const { tenantId } = useAuth();
  const [kpis, setKpis] = useState(INITIAL_KPIS);

  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;

    async function loadKpis() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [newLeads, activeProperties, openDeals, pendingActivities] = await Promise.all([
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", sevenDaysAgo),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "disponible"),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("activities")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "pendiente"),
      ]);

      if (!isMounted) return;

      setKpis({
        newLeads: newLeads.count ?? 0,
        activeProperties: activeProperties.count ?? 0,
        openDeals: openDeals.count ?? 0,
        pendingActivities: pendingActivities.count ?? 0,
      });
    }

    loadKpis();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "leads nuevos (7 días)" }}
                count={kpis.newLeads ?? "—"}
                icon={{ color: "info", component: "person_add" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "propiedades activas" }}
                count={kpis.activeProperties ?? "—"}
                icon={{ color: "info", component: "home" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "negociaciones abiertas" }}
                count={kpis.openDeals ?? "—"}
                icon={{ color: "info", component: "handshake" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "actividades pendientes" }}
                count={kpis.pendingActivities ?? "—"}
                icon={{ color: "info", component: "event_available" }}
              />
            </Grid>
          </Grid>
        </SoftBox>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <DealsByStage />
          </Grid>
          <Grid item xs={12} lg={5}>
            <UpcomingActivities />
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
