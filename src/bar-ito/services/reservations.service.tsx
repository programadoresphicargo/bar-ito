import axios from 'axios';
import type { ReservationPayload } from '../pages/reservations';
const { VITE_API_URL } = import.meta.env;

export const reservationsService = {
  // La API devuelve una lista. Puede filtrar por rango de fechas.
  list: ({ desde, hasta }: { desde?: string; hasta?: string } = {}) => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return axios.get(`${VITE_API_URL}/bar-ito/reservas/?${params.toString()}`);
  },
  create: (payload: ReservationPayload) => axios.post(`${VITE_API_URL}/bar-ito/reservas/`, payload),
  update: (id: number, payload: ReservationPayload) => axios.put(`${VITE_API_URL}/bar-ito/reservas/${id}`, payload),
  remove: (id: number) => axios.delete(`${VITE_API_URL}/bar-ito/reservas/${id}`),
  validar: (id: number, pin: string) => axios.post(`${VITE_API_URL}/bar-ito/reservas/${id}/validar?pin=${pin}`),
};
