import axios, { InternalAxiosRequestConfig } from "axios";

const http = axios.create({
  baseURL: "http://localhost:3000/api", // Ovde stavi port tvog backenda (npr. 5000 ili 4000)
});

// Dodajemo presretač
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Proveravamo da li smo u browseru (jer Next.js nekad izvršava kod na serveru gde nema localStorage)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default http;