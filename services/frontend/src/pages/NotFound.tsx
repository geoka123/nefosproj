import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="text-8xl font-bold text-primary mb-4">404</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            className="gap-2 border-border hover:bg-secondary"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link to="/dashboard">
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
