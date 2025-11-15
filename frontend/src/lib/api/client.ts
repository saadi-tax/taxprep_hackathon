import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL,
  timeout: 15_000,
});

export const fetchApiHealth = async () => {
  const response = await apiClient.get("/healthz");
  return response.data as {
    status: string;
    app: string;
    version: string;
    environment: string;
  };
};

