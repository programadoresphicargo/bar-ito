import axios from 'axios';
// Configura VITE_API_URL en tu .env, por ejemplo: VITE_API_URL=http://localhost:8000
// const API_URL = import.meta.env.VITE_API_URL;

export const reservationsService = {
  // La API devuelve una lista. Puede filtrar por rango de fechas.
  list: ({ desde, hasta }: { desde?: string; hasta?: string } = {}) => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return axios.get(`https://phides-client.phicargo-sistemas.online/bar-ito/reservas/?${params.toString()}`);
  },
  create: (payload) => axios.post("https://phides-client.phicargo-sistemas.online/bar-ito/reservas/", payload),
  update: (id, payload) => axios.put(`https://phides-client.phicargo-sistemas.online/bar-ito/reservas/${id}`, payload),
  remove: (id) => axios.delete(`https://phides-client.phicargo-sistemas.online/bar-ito/reservas/${id}`),
  validar: (id, pin) => axios.post(`https://phides-client.phicargo-sistemas.online/bar-ito/reservas/${id}/validar?pin=${pin}`),
};
