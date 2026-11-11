
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Box,
  IconButton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { reservationsService } from "../services/reservations.service";

interface ValidarReservaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  id: number;
  setDetail: (value: any) => void;
}

export default function ValidarReservaModal({
  open,
  onClose,
  onConfirm,
  id,
  setDetail,
}: ValidarReservaModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPin("");
    }
  }, [open]);

  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      alert("Ingresa un PIN de 4 dígitos.");
      return;
    }

    try {
      setLoading(true);
      const response = await reservationsService.validar(id, pin);
      if (response.data.status == "success") {
        setDetail(response.data.data);
        setPin("");
        onClose();
        await onConfirm();
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      alert(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 700,
          color: "#172B4D",
        }}
      >
        Validar reserva

        <IconButton
          onClick={onClose}
          disabled={loading}
          size="small"
        >
          X
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Para confirmar tu aprobación, ingresa tu PIN
            de seguridad de 4 dígitos.
          </Typography>

          <TextField
            fullWidth
            label="PIN de seguridad"
            type="number"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            placeholder="0000"
            disabled={loading}
            slotProps={{
              htmlInput: {
                min: 0,
                max: 9999,
                step: 1,
                maxLength: 4,
                inputMode: "numeric",
                style: {
                  textAlign: "center",
                  letterSpacing: "12px",
                  fontSize: "24px",
                  fontWeight: 700,
                },
              },
            }}
          />

          <Typography variant="caption" color="text.secondary">
            Tu aprobación será registrada en el historial
            de validaciones de esta reserva.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <button
          onClick={handleSubmit}
          disabled={pin.length !== 4 || loading}
          className="w-full sm:col-span-3 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs"
        >
          Validar reserva
        </button>
      </DialogActions>
    </Dialog>
  );
}
