import { useState } from "react";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";
import AuthRegister from "../authforms/AuthRegister";
import { Link, Navigate } from "react-router";
import { useAuth } from "src/context/AuthContext";

const gradientStyle = {
  background: "linear-gradient(45deg, rgb(238, 119, 82,0.2), rgb(231, 60, 126,0.2), rgb(35, 166, 213,0.2), rgb(35, 213, 171,0.2))",
  backgroundSize: "400% 400%",
  animation: "gradient 15s ease infinite",
  height: "100vh",
  overflow: "hidden",
};

const Register = () => {
  const { session } = useAuth();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={gradientStyle} className="relative overflow-hidden h-screen">
      <div className="flex h-full justify-center items-center px-4">
        <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative wrap-break-word md:w-96 w-full border-none">
          <div className="flex h-full flex-col justify-center gap-2 p-0 w-full">
            <div className="mx-auto">
              <FullLogo />
            </div>
            {pendingEmail ? (
              <>
                <p className="text-sm text-center text-dark my-3">¡Ya casi!</p>
                <p className="text-sm text-center opacity-80">
                  Te enviamos un correo de confirmación a <b>{pendingEmail}</b>. Confírmalo y
                  luego inicia sesión para terminar de crear tu agencia.
                </p>
                <div className="flex gap-2 text-base text-ld font-medium mt-6 items-center justify-center">
                  <Link to="/auth/login" className="text-primary text-sm font-medium">
                    Ir a iniciar sesión
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-center text-dark my-3">Crea tu agencia en Vipe CRM</p>
                <AuthRegister onPendingConfirmation={setPendingEmail} />
                <div className="flex gap-2 text-base text-ld font-medium mt-6 items-center justify-center">
                  <p>¿Ya tienes una cuenta?</p>
                  <Link to="/auth/login" className="text-primary text-sm font-medium">
                    Iniciar sesión
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
