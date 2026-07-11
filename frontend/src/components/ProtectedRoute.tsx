import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "src/context/AuthContext";
import Spinner from "src/views/spinner/Spinner";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner />;
  }

  if (!session) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
