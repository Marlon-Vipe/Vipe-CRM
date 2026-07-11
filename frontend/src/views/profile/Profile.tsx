import CardBox from "src/components/shared/CardBox";
import { Icon } from "@iconify/react";
import { useAuth } from "src/context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueño",
  admin: "Administrador",
  agent: "Agente",
};

const Profile = () => {
  const { user, role, tenant } = useAuth();
  const fullName = (user?.user_metadata?.full_name as string) || "Sin nombre registrado";

  return (
    <CardBox>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-14 h-14 rounded-full flex items-center justify-center bg-lightprimary text-primary">
          <Icon icon="solar:user-circle-outline" height={28} />
        </span>
        <div>
          <h5 className="text-xl font-semibold">{fullName}</h5>
          <p className="opacity-70 text-sm">{user?.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm opacity-60">Agencia</p>
          <p className="font-medium">{tenant?.name || "—"}</p>
        </div>
        <div>
          <p className="text-sm opacity-60">Rol</p>
          <p className="font-medium">{role ? ROLE_LABELS[role] || role : "—"}</p>
        </div>
      </div>
    </CardBox>
  );
};

export default Profile;
