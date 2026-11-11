export interface FamilyMember {
  nombre: string;
  alias: string;
  bg: string;
}

export const FAMILY: FamilyMember[] = [
  { nombre: "Gustavo", alias: "GUS", bg: "bg-amber-400 text-black" },
  { nombre: "Luis", alias: "LUIS", bg: "bg-blue-500 text-white" },
  { nombre: "Cesar", alias: "CES", bg: "bg-purple-500 text-white" },
  { nombre: "Anilu", alias: "ANI", bg: "bg-pink-500 text-white" },
  { nombre: "Juan Carlos", alias: "J.C.", bg: "bg-teal-500 text-white" },
];

export const MONTHS: string[] = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export interface EmptyReservation {
  fecha: string;
  hermano: string;
  titular: string;
  tipo: string;
  estado: string;
  hora_inicio: string;
  hora_fin: string;
  notas: string;
}

export const EMPTY_RESERVATION: EmptyReservation = {
  fecha: "",
  hermano: "",
  titular: "",
  tipo: "",
  estado: "apartado",
  hora_inicio: "14:00",
  hora_fin: "22:00",
  notas: "",
};
