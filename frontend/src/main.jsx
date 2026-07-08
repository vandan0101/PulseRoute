import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import UserContext from "./context/UserContext.jsx";
import CaptainContext from "./context/CapatainContext.jsx";
import SocketProvider from "./context/SocketContext.jsx";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:4000";

axios.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("captain-token") ||
    localStorage.getItem("user-token") ||
    localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Received 401 from API:', error.response?.data?.message || error.message);
      // Do not clear localStorage here; let components handle redirect and token lifecycle.
    }
    return Promise.reject(error);
  },
);

createRoot(document.getElementById("root")).render(
  <CaptainContext>
    <UserContext>
      <SocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </UserContext>
  </CaptainContext>,
);
