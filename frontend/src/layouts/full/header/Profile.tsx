import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "src/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "src/context/AuthContext";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <div className="relative group/menu">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <span
              {...props}
              className="h-10 w-10 hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary focus:outline-hidden"
              title={user?.email || ""}
            >
              <Icon icon="solar:user-circle-outline" height={28} />
            </span>
          )}
        />
        <DropdownMenuContent className="rounded-sm w-52 p-1" align="end">
          <div className="px-3 py-2 text-xs opacity-60 truncate">{user?.email}</div>
          <DropdownMenuItem className="p-0 focus:bg-transparent">
            <Link
              to="/profile"
              className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-dark focus:bg-lighthover focus:text-primary rounded-md"
            >
              <Icon icon="solar:user-circle-outline" height={20} />
              Mi perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="p-0 focus:bg-transparent">
            <Link
              to="/billing"
              className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-dark focus:bg-lighthover focus:text-primary rounded-md"
            >
              <Icon icon="solar:bill-check-outline" height={20} />
              Facturación
            </Link>
          </DropdownMenuItem>
          <div className="p-3 pt-0">
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 w-full border border-primary text-primary bg-transparent hover:bg-lightprimary outline-hidden focus:outline-hidden inline-flex items-center justify-center rounded-lg h-7 px-2.5 text-[0.8rem] transition-all cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Profile;
