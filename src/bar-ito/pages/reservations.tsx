
export interface ReservationValidation {
 id: number;
 usuario?: string | null;
 user_id: number;
 created_at: string;
}

export interface Reservation {
 id: number;
 fecha: string;
 hermano: string;
 titular: string;
 tipo: string | null;
 estado: string;
 hora_inicio: string;
 hora_fin: string;
 notas: string | null;
 validaciones?: ReservationValidation[] | null;
}

export interface ReservationPayload {
 fecha: string;
 hermano: string;
 titular: string;
 tipo: string;
 estado: string;
 hora_inicio: string;
 hora_fin: string;
 notas: string;
}

export type ReservationForm = Omit<
 Reservation,
 "id" | "validaciones"
> & {
 id?: number | null;
};
