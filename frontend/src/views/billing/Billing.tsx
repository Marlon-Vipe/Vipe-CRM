import { useEffect, useState } from "react";
import CardBox from "src/components/shared/CardBox";
import { Icon } from "@iconify/react";
import { supabase } from "src/lib/supabaseClient";
import { useAuth } from "src/context/AuthContext";

interface Subscription {
  plan: string;
  status: string;
  renews_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  trial: "En prueba",
  activa: "Activa",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

const Billing = () => {
  const { tenantId } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let isMounted = true;

    supabase
      .from("subscriptions")
      .select("plan, status, renews_at")
      .eq("tenant_id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted) return;
        setSubscription(data as Subscription | null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return (
    <CardBox>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-14 h-14 rounded-full flex items-center justify-center bg-lightprimary text-primary">
          <Icon icon="solar:bill-check-outline" height={28} />
        </span>
        <h5 className="text-xl font-semibold">Facturación</h5>
      </div>
      {loading ? (
        <p className="opacity-70">Cargando...</p>
      ) : subscription ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-60">Plan</p>
            <p className="font-medium capitalize">{subscription.plan}</p>
          </div>
          <div>
            <p className="text-sm opacity-60">Estado</p>
            <p className="font-medium">{STATUS_LABELS[subscription.status] || subscription.status}</p>
          </div>
        </div>
      ) : (
        <p className="opacity-70">No se encontró información de suscripción.</p>
      )}
    </CardBox>
  );
};

export default Billing;
