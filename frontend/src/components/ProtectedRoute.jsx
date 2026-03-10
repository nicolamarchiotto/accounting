import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        setAuthenticated(res.ok);
      } catch (e) {
        console.error("Auth check failed:", e);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!authenticated) {
    // Redirect to login and pass state
    return <Navigate to="/" state={{ mustLogin: true }} replace />;
  }

  return children;
}

export default ProtectedRoute;