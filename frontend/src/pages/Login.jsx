// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import { useSnackbar } from "../components/SnackbarProvider";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();

  // Show snackbar if redirected due to authentication
 useEffect(() => {
    if (location.state?.mustLogin) {
      showSnackbar("You must login to access this page.", "warning");

      // Reset location state so snackbar doesn't show again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, showSnackbar]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      await response.json();
      navigate("/home");
    } catch (err) {
      showSnackbar("Invalid credentials", "error");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          sx={{ padding: 4, width: "100%" }}
          elevation={3}
          component="form"
          onSubmit={handleLogin}
        >
          <Typography variant="h5" gutterBottom>
            Login
          </Typography>

          <TextField
            fullWidth
            label="Username"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;