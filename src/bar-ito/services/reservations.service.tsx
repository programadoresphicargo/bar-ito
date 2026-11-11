import axios from 'axios';
const { VITE_ODOO_API_URL } = import.meta.env;

export const reservationsService = {
  // La API devuelve una lista. Puede filtrar por rango de fechas.
  list: ({ desde, hasta }: { desde?: string; hasta?: string } = {}) => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return axios.get(`${VITE_ODOO_API_URL}/bar-ito/reservas/?${params.toString()}`);
  },
  create: (payload) => axios.post(`${VITE_ODOO_API_URL}/bar-ito/reservas/`, payload),
  update: (id: number, payload) => axios.put(`${VITE_ODOO_API_URL}/bar-ito/reservas/${id}`, payload),
  remove: (id: number) => axios.delete(`${VITE_ODOO_API_URL}/bar-ito/reservas/${id}`),
  validar: (id: number, pin) => axios.post(`${VITE_ODOO_API_URL}/bar-ito/reservas/${id}/validar?pin=${pin}`),
};
