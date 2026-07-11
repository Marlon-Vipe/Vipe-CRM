import { useEffect, useState } from "react";
import KpiCard from "src/components/dashboard/KpiCard";
import DealsByStage from "src/components/dashboard/DealsByStage";
import UpcomingActivities from "src/components/dashboard/UpcomingActivities";
import { supabase } from "src/lib/supabaseClient";
import { useAuth } from "src/context/AuthContext";

interface Kpis {
  newLeads: number | null;
  activeProperties: number | null;
  openDeals: number | null;
  pendingActivities: number | null;
}

const Dashboard = () => {
  const { tenantId } = useAuth();
  const [kpis, setKpis] = useState<Kpis>({
    newLeads: null,
    activeProperties: null,
    openDeals: null,
    pendingActivities: null,
  });

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
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
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
    <div className="grid grid-cols-12 gap-30">
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiCard title="Leads nuevos (7 días)" count={kpis.newLeads ?? "—"} icon="solar:user-plus-rounded-line-duotone" />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiCard title="Propiedades activas" count={kpis.activeProperties ?? "—"} icon="solar:home-2-line-duotone" />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiCard title="Negociaciones abiertas" count={kpis.openDeals ?? "—"} icon="solar:chart-2-line-duotone" />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiCard title="Actividades pendientes" count={kpis.pendingActivities ?? "—"} icon="solar:calendar-mark-line-duotone" />
      </div>
      <div className="col-span-12 lg:col-span-7">
        <DealsByStage />
      </div>
      <div className="col-span-12 lg:col-span-5">
        <UpcomingActivities />
      </div>
    </div>
  );
};

export default Dashboard;
