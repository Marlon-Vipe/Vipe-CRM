import { useState } from "react";

// react-router-dom components
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftAlert from "components/SoftAlert";

// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";

// CRM Inmobiliario
import { useAuth } from "context/AuthContext";

// Images
import curved9 from "assets/images/curved-images/curved-6.jpg";

function SignIn() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (session) {
    const redirectTo = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos."
            : error.message
        );
        return;
      }
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CoverLayout
      title="Bienvenido de nuevo"
      description="Ingresa tu email y contraseña para iniciar sesión"
      image={curved9}
    >
      <SoftBox component="form" role="form" onSubmit={handleSubmit}>
        {errorMessage && (
          <SoftBox mb={2}>
            <SoftAlert color="error" dismissible>
              {errorMessage}
            </SoftAlert>
          </SoftBox>
        )}
        <SoftBox mb={2}>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Email
            </SoftTypography>
          </SoftBox>
          <SoftInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </SoftBox>
        <SoftBox mb={2}>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Contraseña
            </SoftTypography>
          </SoftBox>
          <SoftInput
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </SoftBox>
        <SoftBox mt={4} mb={1}>
          <SoftButton type="submit" variant="gradient" color="info" fullWidth disabled={submitting}>
            {submitting ? "ingresando..." : "iniciar sesión"}
          </SoftButton>
        </SoftBox>
        <SoftBox mt={3} textAlign="center">
          <SoftTypography variant="button" color="text" fontWeight="regular">
            ¿No tienes una cuenta?{" "}
            <SoftTypography
              component={Link}
              to="/authentication/sign-up"
              variant="button"
              color="info"
              fontWeight="medium"
              textGradient
            >
              Regístrate
            </SoftTypography>
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </CoverLayout>
  );
}

export default SignIn;
