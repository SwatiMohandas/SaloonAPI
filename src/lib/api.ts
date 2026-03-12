import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5148/api",
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const shopApi = {
  createShop: (data: FormData) => api.post("/shops", data),
  getShop: (id: number) => api.get(`/shops/${id}`),
  updateShop: (id: number, data: FormData) => api.put(`/shops/${id}`, data),
  deleteShop: (id: number) => api.delete(`/shops/${id}`),
  addServices: (shopId: number, data: any) =>
    api.post(`/shops/${shopId}/services`, data),
  getReviews: (shopId: number) => api.get(`/reviews/shop/${shopId}`),
  addReview: (data: { shopId: number; rating: number; comment: string }) =>
    api.post("/reviews", data),
  getQueue: (shopId: number) => api.get(`/queue/${shopId}`),
  getMyServiceHistory: () => api.get("/queue/history"),
  getUserInfo: () => api.get("/auth/me"),
  joinQueue: (data: any) => api.post("/queue/join", data),
  updateQueueStatus: (id: number, status: string) =>
    api.put(`/queue/${id}/status`, { status }),
  cancelBooking: (id: number) => api.put(`/queue/${id}/cancel`),
  delayBooking: (id: number) => api.put(`/queue/${id}/delay`),
  verifyOtp: (data: { email: string; mobileNumber: string; otp: string }) =>
    api.post("/auth/verify-otp", data),
  getSlots: (shopId: number, date: string) =>
    api.get(`/queue/slots?shopId=${shopId}&date=${date}`),
  //const res = await shopApi.getSlots(shopId, date);
//setSlots(Array.isArray(res.data?.slots) ? res.data.slots : []);

};

export const specializationApi = {
  getAll: () => api.get("/specialization"),
  getById: (id: number) => api.get(`/specialization/${id}`),
  create: (data: { specializationName: string; description: string }) =>
    api.post("/specialization", data),
  update: (
    id: number,
    data: { specializationName: string; description: string }
  ) => api.put(`/specialization/${id}`, data),
  delete: (id: number) => api.delete(`/specialization/${id}`),
};

export const staffApi = {
  getAll: () => api.get("/staff"),
  getById: (id: string) => api.get(`/staff/${id}`),
  create: (data: {
    staffName: string;
    address: string;
    phoneNumber: string;
    aadharNumber: string;
    specializationIds: number[];
  }) => api.post("/staff", data),
  update: (
    id: string,
    data: {
      staffName: string;
      address: string;
      phoneNumber: string;
      aadharNumber: string;
      specializationIds: number[];
    }
  ) => api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

export default api;
