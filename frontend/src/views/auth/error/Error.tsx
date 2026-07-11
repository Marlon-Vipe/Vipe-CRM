
import { Link } from "react-router";
import ErrorImg from "/src/assets/images/backgrounds/errorimg.svg";
import { Button } from "src/components/ui/button";
const Error = () => {
  return (
    <>
      <div className="h-screen flex items-center justify-center bg-white dark:bg-darkgray">
        <div className="text-center">
          <img src={ErrorImg} alt="error" className="mb-4" />
          <h1 className="text-ld text-4xl mb-6">¡Ups!</h1>
          <h6 className="text-xl text-ld">
            No pudimos encontrar la página que buscas.
          </h6>
          <Button
            variant="default"
            render={<Link to="/" />}
            className="w-fit mt-6 mx-auto"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </>
  );
};

export default Error;
