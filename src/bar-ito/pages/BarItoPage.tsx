import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import { FAMILY, MONTHS, EMPTY_RESERVATION } from "../constants/family";
import { reservationsService } from "../services/reservations.service";
import "../bar-ito.css";
import ValidarReservaModal from "./validart";

interface ReservationValidation {
  id: number;
  usuario?: string | null;
  user_id: number | string;
  created_at: string;
}

interface Reservation {
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

type ReservationForm = Omit<Reservation, "id" | "validaciones"> & {
  id?: number | null;
};

interface ReservationPayload {
  fecha: string;
  hermano: string;
  titular: string;
  tipo: string;
  estado: string;
  hora_inicio: string;
  hora_fin: string;
  notas: string;
}

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}

interface DetailItem {
  label: string;
  value: string;
}

const pad = (n: number): string => String(n).padStart(2, "0");

const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dateFromISO = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (value: string): string => {
  const date = dateFromISO(value);
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
};

const getString = (form: FormData, key: string): string => {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;
    if (typeof response === "object" && response !== null && "data" in response) {
      const data = response.data;
      if (typeof data === "object" && data !== null && "detail" in data) {
        const detail = data.detail;
        if (typeof detail === "string") return detail;
        if (detail != null) return JSON.stringify(detail) ?? "Ocurrió un error inesperado.";
      }
    }
  }

  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
};

function Modal({ children, onClose, wide = false }: ModalProps) {
  const stopPropagation = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4 overflow-y-auto"
      onMouseDown={onClose}
    >
      <div
        className={`bg-[#16181d] border border-amber-500/40 rounded-2xl w-full ${wide ? "max-w-5xl" : "max-w-xl"
          } p-5 sm:p-6 shadow-2xl animate-pop-in relative my-8`}
        onMouseDown={stopPropagation}
      >
        {children}
      </div>
    </div>
  );
}

export default function BarItoPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [editing, setEditing] = useState<ReservationForm | null>(null);
  const [search, setSearch] = useState<string>("");
  const [familyFilter, setFamilyFilter] = useState<string>("todos");
  const [toast, setToast] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const loadReservations = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const first = toISODate(currentMonth);
      const lastDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const result: unknown = await reservationsService.list({
        desde: first,
        hasta: toISODate(lastDate),
      });

      if (Array.isArray(result)) {
        setReservations(result as Reservation[]);
      } else if (
        typeof result === "object" &&
        result !== null &&
        "data" in result &&
        Array.isArray(result.data)
      ) {
        setReservations(result.data as Reservation[]);
      } else {
        setReservations([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const reservationsByDate = useMemo<Record<string, Reservation>>(
    () => Object.fromEntries(reservations.map((reservation) => [reservation.fecha, reservation])),
    [reservations],
  );

  const agenda = useMemo<Reservation[]>(() => {
    const term = search.trim().toLocaleLowerCase();
    return [...reservations]
      .filter((reservation) => familyFilter === "todos" || reservation.hermano === familyFilter)
      .filter(
        (reservation) =>
          !term ||
          (reservation.titular || "").toLocaleLowerCase().includes(term) ||
          (reservation.tipo || "").toLocaleLowerCase().includes(term),
      )
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [reservations, search, familyFilter]);

  const openNew = (fecha: string = toISODate(new Date())): void => {
    setEditing({ ...EMPTY_RESERVATION, fecha } as ReservationForm);
    setFormOpen(true);
    setDetail(null);
  };

  const openEdit = (reservation: Reservation): void => {
    setEditing({ ...EMPTY_RESERVATION, ...reservation });
    setDetail(null);
    setFormOpen(true);
  };

  const saveReservation = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: ReservationPayload = {
      fecha: getString(form, "fecha"),
      hermano: getString(form, "hermano"),
      titular: getString(form, "titular"),
      tipo: getString(form, "tipo") || "Reunión Familiar",
      estado: getString(form, "estado"),
      hora_inicio: getString(form, "hora_inicio"),
      hora_fin: getString(form, "hora_fin"),
      notas: getString(form, "notas"),
    };

    const occupied = reservations.find(
      (reservation) =>
        reservation.fecha === payload.fecha &&
        String(reservation.id) !== String(editing?.id ?? ""),
    );
    if (occupied && !window.confirm(`El día ya tiene una reserva de ${occupied.titular}.`)) return;

    setSaving(true);
    try {
      if (editing?.id) {
        await reservationsService.update(editing.id, payload);
      } else {
        await reservationsService.create(payload);
      }
      setFormOpen(false);
      setEditing(null);
      setToast("Reserva guardada correctamente");
      await loadReservations();
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      window.alert(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteReservation = async (): Promise<void> => {
    if (!detail || !window.confirm(`¿Cancelar la reserva de ${detail.titular}?`)) return;
    try {
      await reservationsService.remove(detail.id);
      setDetail(null);
      setToast("Reserva eliminada");
      await loadReservations();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const shareWhatsApp = (): void => {
    if (!detail) return;
    const status = detail.estado === "apartado" ? "🔴 *APARTADO*" : "🟠 *SOLICITUD PENDIENTE*";
    const message = `🎉 *RESERVA BAR ITO* 🎉\n${status}\n\n🗓 *Fecha:* ${formatDate(detail.fecha)}\n⏰ *Horario:* ${detail.hora_inicio} a ${detail.hora_fin}\n👤 *Titular / Reserva:* ${detail.titular}\n👨‍👩‍👧‍👦 *Hermano Responsable:* ${detail.hermano}\n🎈 *Evento:* ${detail.tipo || "Reunión Familiar"}\n${detail.notas ? `📝 *Notas:* ${detail.notas}\n` : ""}\n_¡Favor de confirmar o revisar en la App de Reservas BAR ITO!_`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const today = toISODate(new Date());

  const detailItems: DetailItem[] = detail
    ? [
      { label: "Fecha", value: formatDate(detail.fecha) },
      { label: "Hermano Responsable", value: detail.hermano },
      { label: "Titular / Reservó", value: detail.titular },
      { label: "Horario", value: `${detail.hora_inicio} - ${detail.hora_fin}` },
    ]
    : [];

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-gray-100 pb-12">
      <header className="sticky top-0 z-20 bg-[#121316]/95 border-b border-[#262830] backdrop-blur-md px-4 py-3 sm:py-4 mb-6 shadow-xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-bg flex items-center justify-center text-black text-xl">🥂</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider gold-gradient-text">BAR ITO</h1>
              <p className="text-xs text-gray-400 font-medium">Salón de Eventos Familiar • 5 Hermanos</p>
            </div>
          </div>
          <button onClick={() => openNew()} className="w-full sm:w-auto px-4 py-2.5 rounded-xl gold-bg text-black font-bold text-sm hover:brightness-110 active:scale-95 transition-all">＋ Nueva Reserva</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 space-y-6">
        <section className="bg-[#16181d] border border-[#2a2d37] rounded-2xl p-4 shadow-lg">
          <div className="flex justify-between gap-3 mb-3">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">👥 Ramas Familiares y Responsables</span>
            <span className="text-xs text-gray-400">Hermanos e Hijos asignados</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {FAMILY.map((person) => (
              <div key={person.nombre} className="bg-[#101115] border border-[#252733] rounded-xl p-2.5 flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${person.bg} flex items-center justify-center font-bold text-xs`}>{person.alias}</div>
                <div className="truncate"><h4 className="text-xs font-bold text-gray-200 truncate">{person.nombre}</h4><span className="text-[10px] text-gray-400">Familia</span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#16181d] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-5 bg-[#0f1013] p-3 sm:p-4 rounded-xl border border-[#242630]">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-10 h-10 rounded-lg bg-[#1c1e26] border border-[#323543] hover:border-amber-400 text-amber-400">‹</button>
            <div className="text-center">
              <h2 className="text-lg sm:text-2xl font-bold text-white capitalize">{MONTHS[month]} {year}</h2>
              <p className="text-xs text-gray-400">Toca un día para reservar o ver detalles</p>
            </div>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-10 h-10 rounded-lg bg-[#1c1e26] border border-[#323543] hover:border-amber-400 text-amber-400">›</button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4 text-xs text-gray-300 bg-[#121317] py-2.5 px-4 rounded-xl border border-[#22242e]">
            <span><i className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-2" />Disponible</span>
            <span><i className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2" />Solicitud Pendiente</span>
            <span><i className="inline-block w-3 h-3 rounded-full bg-rose-600 mr-2" />Apartado / Confirmado</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => <span key={d} className="text-xs font-semibold text-amber-400/80 py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: offset }, (_, i) => <div key={`empty-${i}`} className="day-card rounded-xl bg-[#0f1013]/40 border border-transparent" />)}
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1;
              const date = toISODate(new Date(year, month, day));
              const reservation = reservationsByDate[date];
              const isToday = date === today;
              const family = FAMILY.find((p) => p.nombre === reservation?.hermano) || FAMILY[0];
              return (
                <button key={date} onClick={() => reservation ? setDetail(reservation) : openNew(date)}
                  className={`day-card rounded-xl p-1.5 flex flex-col justify-between text-left border relative overflow-hidden ${reservation ? (reservation.estado === "apartado" ? "bg-rose-950/70 border-rose-600/80 text-rose-100" : reservation.estado == "confirmado" ? "bg-success-800/70 border-success" : "bg-orange-950/70 border-orange-500/80 text-orange-100") : isToday ? "bg-[#1b1e28] border-amber-400 text-amber-400" : "bg-[#111216] border-[#22242e] hover:bg-[#181a20] text-gray-300"}`}>
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-extrabold ${isToday ? "bg-amber-400 text-black px-1.5 py-0.5 rounded-md" : ""}`}>{day}</span>
                    {reservation ? <span className={`text-[9px] px-1 rounded font-black ${family.bg}`}>{family.alias}</span> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                  {reservation && <div className="mt-1 min-w-0"><p className="text-[10px] font-bold leading-tight truncate text-amber-200">{reservation.titular}</p><p className="text-[9px] text-gray-300 truncate">{reservation.tipo || "Evento"}</p></div>}
                </button>
              );
            })}
          </div>
          {loading && <p className="text-center text-xs text-amber-300 mt-3">Cargando reservas...</p>}
        </section>

        <section className="bg-[#16181d] border border-[#2a2d37] rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4 sm:items-center">
            <div><h3 className="text-lg font-bold text-white">☷ Próximos Eventos y Reservas</h3><p className="text-xs text-gray-400">Listado del mes consultado, ordenado por fecha</p></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar evento o titular..." className="bg-[#0f1013] border border-[#2b2d38] focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none" />
              <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)} className="bg-[#0f1013] border border-[#2b2d38] rounded-xl px-2.5 py-2 text-xs text-amber-400 outline-none">
                <option value="todos">Todos los Hermanos</option>
                {FAMILY.map((p) => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/50 p-3 text-xs text-rose-300">{error}</div>}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {!agenda.length && <div className="text-center py-8 text-gray-500 text-xs">No se encontraron reservas con los filtros aplicados.</div>}
            {agenda.map((r) => {
              const family = FAMILY.find((p) => p.nombre === r.hermano) || FAMILY[0];
              return <button key={r.id} onClick={() => setDetail(r)} className="w-full text-left bg-[#0f1013] hover:bg-[#14161c] border border-[#22242e] hover:border-amber-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition">
                <div className="flex items-center gap-3 min-w-0"><div className={`w-2.5 h-10 rounded-full shrink-0 ${r.estado === "apartado" ? "bg-rose-500" : "bg-orange-500"}`} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-bold text-white">{r.titular}</h4><span className={`text-[10px] px-1.5 rounded font-bold ${family.bg}`}>{r.hermano}</span></div><p className="text-xs text-gray-400 truncate">{r.tipo || "Evento"} • <span className="text-amber-400">{formatDate(r.fecha)}</span> ({r.hora_inicio} a {r.hora_fin})</p></div></div><span className="text-gray-600">›</span>
              </button>;
            })}
          </div>
        </section>
      </main>

      {formOpen && <Modal onClose={() => setFormOpen(false)}>
        <button onClick={() => setFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h3 className="text-xl font-bold gold-gradient-text mb-1">{editing?.id ? "Editar Reserva" : "Nueva Reserva"}</h3>
        <p className="text-xs text-gray-400 mb-4">Completa los detalles de la reserva para el salón.</p>
        <form onSubmit={saveReservation} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label">Fecha del Evento *<input name="fecha" type="date" required defaultValue={editing?.fecha} className="field-input" /></label>
            <label className="field-label">Estado<select name="estado" defaultValue={editing?.estado || "apartado"} className="field-input"><option value="apartado">🟠 Apartado</option></select></label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="field-label">Hermano Responsable *<select name="hermano" required defaultValue={editing?.hermano || ""} className="field-input"><option value="">Selecciona...</option>{FAMILY.map((p) => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}</select></label>
            <label className="field-label">Titular *<input name="titular" required defaultValue={editing?.titular || ""} placeholder="Ej. Sofía (Hija)" className="field-input" /></label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="field-label">Tipo de Evento<input name="tipo" defaultValue={editing?.tipo || ""} placeholder="Cumpleaños..." className="field-input" /></label>
            <label className="field-label">Hora Inicio<input name="hora_inicio" type="time" defaultValue={editing?.hora_inicio || "14:00"} className="field-input" /></label>
            <label className="field-label">Hora Fin<input name="hora_fin" type="time" defaultValue={editing?.hora_fin || "22:00"} className="field-input" /></label>
          </div>
          <label className="field-label">Notas adicionales<textarea name="notas" defaultValue={editing?.notas || ""} className="field-input resize-none" placeholder="Observaciones..." /></label>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2.5 rounded-xl bg-[#252834] text-gray-300 text-sm">Cancelar</button><button disabled={saving} className="px-5 py-2.5 rounded-xl gold-bg text-black font-bold text-sm disabled:opacity-50">{saving ? "Guardando..." : "Guardar Reserva"}</button></div>
        </form>
      </Modal>}

      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <button
            onClick={() => setDetail(null)}
            className="absolute top-4 right-4 text-gray-400"
          >
            ✕
          </button>

          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black ${(FAMILY.find((p) => p.nombre === detail.hermano) || FAMILY[0]).bg
                }`}
            >
              {(FAMILY.find((p) => p.nombre === detail.hermano) || FAMILY[0]).alias}
            </div>

            <div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mb-1 ${detail.estado === "apartado"
                  ? "bg-rose-950 text-rose-300"
                  : "bg-orange-950 text-orange-300"
                  }`}
              >
                {detail.estado === "apartado"
                  ? "Apartado"
                  : detail.estado === "confirmado"
                    ? "Confirmado"
                    : "Pendiente"}
              </span>

              <h3 className="text-xl font-bold text-white">
                {detail.tipo || "Evento Familiar"}
              </h3>
            </div>
          </div>

          {/* Contenido en dos columnas */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">

            {/* Información de la reserva */}
            <div>
              <div className="space-y-3 bg-[#0d0e11] p-4 rounded-xl border border-[#232530] text-sm mb-5">
                {detailItems.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between gap-3 border-b border-[#1e2029] pb-2"
                  >
                    <span className="text-gray-400 text-xs">{label}:</span>
                    <span className="font-bold text-white text-right">{value}</span>
                  </div>
                ))}

                <div>
                  <span className="text-gray-400 text-xs block mb-1">Notas:</span>
                  <p className="text-xs text-gray-300 italic bg-[#15171e] p-2 rounded-lg">
                    {detail.notas || "Sin observaciones adicionales."}
                  </p>
                </div>
              </div>
            </div>

            {/* Usuarios que validaron */}
            <div className="bg-[#0d0e11] rounded-xl border border-[#232530] p-4 h-fit">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Validaciones
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    Usuarios que confirmaron
                  </p>
                </div>

                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full">
                  {detail.validaciones?.length || 0}/5
                </span>
              </div>

              <div className="space-y-2">
                {(detail.validaciones?.length ?? 0) > 0 ? (
                  detail.validaciones?.map((validacion) => (
                    <div
                      key={validacion.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-[#15171e] border border-[#232530]"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {validacion.usuario?.charAt(0) || "U"}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-white truncate">
                          {validacion.usuario || `Usuario ${validacion.user_id}`}
                        </p>

                        <p className="text-[10px] text-gray-500">
                          {validacion.created_at}
                        </p>
                      </div>

                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-5">
                    Aún no hay validaciones.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setOpen(true)}
              disabled={detail.estado === "confirmado" || detail.estado === "cancelado"}
              className="sm:col-span-3 py-2.5 rounded-xl bg-warning-500 hover:bg-warning-600 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Validar reserva
            </button>

            <button
              onClick={shareWhatsApp}
              className="sm:col-span-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Compartir en WhatsApp
            </button>

            <button
              onClick={() => openEdit(detail)}
              className="py-2 rounded-xl bg-[#262935] text-amber-400 text-xs font-semibold"
            >
              Editar
            </button>

            <button
              onClick={deleteReservation}
              className="sm:col-span-2 py-2 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs font-semibold"
            >
              Cancelar Reserva
            </button>
          </div>

          <ValidarReservaModal
            open={open}
            onClose={() => setOpen(false)}
            id={detail.id}
            onConfirm={loadReservations}
            setDetail={setDetail}
          />
        </Modal>
      )}
      {toast && <div className="fixed bottom-5 right-5 z-[60] bg-amber-400 text-black px-4 py-3 rounded-xl shadow-2xl font-bold text-sm">{toast}</div>}
    </div>
  );
}
