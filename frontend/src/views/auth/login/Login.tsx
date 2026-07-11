import FullLogo from "src/layouts/full/shared/logo/FullLogo";
import AuthLogin from "../authforms/AuthLogin";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "src/context/AuthContext";

const gradientStyle = {
  background: "linear-gradient(45deg, rgb(238, 119, 82,0.2), rgb(231, 60, 126,0.2), rgb(35, 166, 213,0.2), rgb(35, 213, 171,0.2))",
  backgroundSize: "400% 400%",
  animation: "gradient 15s ease infinite",
  height: "100vh",
};

const Login = () => {
  const { session } = useAuth();
  const location = useLocation();

  if (session) {
    const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div style={gradientStyle} className="relative overflow-hidden h-screen">
      <div className="flex h-full justify-center items-center px-4">
        <div className="rounded-xl shadow-md bg-white dark:bg-darkgray p-6 w-full md:w-96 border-none">
          <div className="flex flex-col gap-2 p-0 w-full">
            <div className="mx-auto">
              <FullLogo />
            </div>
            <p className="text-sm text-center text-dark my-3">Ingresa a tu cuenta de Vipe CRM</p>
            <AuthLogin />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
