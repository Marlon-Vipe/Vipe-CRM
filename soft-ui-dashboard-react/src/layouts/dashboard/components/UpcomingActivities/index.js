import { useEffect, useState } from "react";

// @mui material components
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React examples
import TimelineItem from "examples/Timeline/TimelineItem";

// CRM Inmobiliario
import { supabase } from "lib/supabaseClient";
import { useAuth } from "context/AuthContext";

const ACTIVITY_ICON = {
  llamada: "call",
  visita: "home",
  email: "email",
  whatsapp: "chat",
  tarea_general: "task_alt",
};

const ACTIVITY_COLOR = {
  llamada: "info",
  visita: "success",
  email: "warning",
  whatsapp: "primary",
  tarea_general: "dark",
};

const ACTIVITY_LABEL = {
  llamada: "Llamada",
  visita: "Visita",
  email: "Email",
  whatsapp: "WhatsApp",
  tarea_general: "Tarea",
};

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function UpcomingActivities() {
  const { tenantId } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;

    async function loadActivities() {
      const { data } = await supabase
        .from("activities")
        .select("id, type, notes, due_at, contacts ( name )")
        .eq("tenant_id", tenantId)
        .eq("status", "pendiente")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(6);

      if (!isMounted) return;
      setActivities(data || []);
      setLoading(false);
    }

    loadActivities();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return (
    <Card className="h-100">
      <SoftBox pt={3} px={3}>
        <SoftTypography variant="h6" fontWeight="medium">
          Próximas actividades
        </SoftTypography>
      </SoftBox>
      <SoftBox p={2}>
        {!loading && activities.length === 0 ? (
          <SoftBox px={1} pb={1}>
            <SoftTypography variant="button" color="text">
              No tienes actividades pendientes.
            </SoftTypography>
          </SoftBox>
        ) : (
          activities.map((activity, index) => (
            <TimelineItem
              key={activity.id}
              color={ACTIVITY_COLOR[activity.type] || "dark"}
              icon={ACTIVITY_ICON[activity.type] || "task_alt"}
              title={`${ACTIVITY_LABEL[activity.type] || activity.type}${
                activity.contacts?.name ? ` · ${activity.contacts.name}` : ""
              }`}
              dateTime={activity.due_at ? dateFormatter.format(new Date(activity.due_at)) : "Sin fecha"}
              description={activity.notes || ""}
              lastItem={index === activities.length - 1}
            />
          ))
        )}
      </SoftBox>
    </Card>
  );
}

export default UpcomingActivities;
