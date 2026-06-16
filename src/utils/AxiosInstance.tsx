import axios from 'axios';
import { apiUrl } from '../environment/env';
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Time-Zone': timeZone,
  },
});
import Cookies from "js-cookie";

apiClient.interceptors.request.use(
  (config) => {
    let webViewToken: string | null = ""
    if (localStorage.getItem("webView")) {
      webViewToken = localStorage.getItem("webView");
    }
    const token = JSON.parse(localStorage?.user)?.token || webViewToken
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    if (response?.data?.isRedirect) {
      localStorage.removeItem("user");
      localStorage.removeItem("companyConfigs");
      localStorage.removeItem("quickBooks");
      Cookies.remove('token');

      window.location.reload();
      return Promise.reject(new Error('Redirecting to login due to invalid session'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("companyConfigs");
      localStorage.removeItem("quickBooks");
      Cookies.remove('token');

      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
