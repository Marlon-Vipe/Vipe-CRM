import { useEffect, useState } from "react";
import CardBox from "src/components/shared/CardBox";
import { Icon } from "@iconify/react";
import { supabase } from "src/lib/supabaseClient";
import { useAuth } from "src/context/AuthContext";

interface Activity {
  id: string;
  type: string;
  notes: string | null;
  due_at: string | null;
  contacts: { name: string } | null;
}

const ACTIVITY_ICON: Record<string, string> = {
  llamada: "solar:phone-calling-line-duotone",
  visita: "solar:home-2-line-duotone",
  email: "solar:letter-linear",
  whatsapp: "solar:chat-round-line-line-duotone",
  tarea_general: "solar:checklist-minimalistic-line-duotone",
};

const ACTIVITY_LABEL: Record<string, string> = {
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

const UpcomingActivities = () => {
  const { tenantId } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let isMounted = true;

    supabase
      .from("activities")
      .select("id, type, notes, due_at, contacts ( name )")
      .eq("tenant_id", tenantId)
      .eq("status", "pendiente")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(6)
      .then(({ data }) => {
        if (!isMounted) return;
        setActivities((data as unknown as Activity[]) || []);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return (
    <CardBox className="h-full">
      <h5 className="text-lg font-semibold mb-4">Próximas actividades</h5>
      {!loading && activities.length === 0 ? (
        <p className="opacity-70 text-sm">No tienes actividades pendientes.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-lightprimary text-primary">
                <Icon icon={ACTIVITY_ICON[activity.type] || "solar:checklist-minimalistic-line-duotone"} height={18} />
              </span>
              <div>
                <p className="text-sm font-medium">
                  {ACTIVITY_LABEL[activity.type] || activity.type}
                  {activity.contacts?.name ? ` · ${activity.contacts.name}` : ""}
                </p>
                <p className="text-xs opacity-60">
                  {activity.due_at ? dateFormatter.format(new Date(activity.due_at)) : "Sin fecha"}
                </p>
                {activity.notes && <p className="text-xs opacity-70 mt-1">{activity.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardBox>
  );
};

export default UpcomingActivities;
