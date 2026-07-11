import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { useAuth } from "context/AuthContext";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <SoftTypography variant="button" color="text">
          Cargando...
        </SoftTypography>
      </SoftBox>
    );
  }

  if (!session) {
    return <Navigate to="/authentication/sign-in" state={{ from: location }} replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
