import { useState, type FormEvent } from "react";
import { Button } from "src/components/ui/button";
import { Label } from "src/components/ui/label";
import { Input } from "src/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router";

import { useAuth } from "src/context/AuthContext";

const AuthLogin = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      const redirectTo =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
      navigate(redirectTo);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="email">Email</Label>
          </div>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="form-control form-rounded-xl"
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="userpwd">Contraseña</Label>
          </div>
          <Input
            id="userpwd"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="form-control form-rounded-xl"
          />
        </div>
        <div className="flex justify-end my-5">
          <Link to={"/auth/register"} className="text-primary text-sm font-medium">
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl"
        >
          {submitting ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;
