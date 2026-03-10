import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import SnackbarProvider from "./components/SnackbarProvider";
import Layout from "./components/Layout";
import { Box } from "@mui/material";

function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider>
        <Box
          sx={{
            minHeight: "100vh",
            backgroundColor: "background.default",
          }}
        >
          <Routes>
            <Route path="/" element={<Login />} />  // free page
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Box>
      </SnackbarProvider>
    </BrowserRouter>
  );
}

export default App;