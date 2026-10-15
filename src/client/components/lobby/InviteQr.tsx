import React, {useEffect, useState} from 'react';
import QRCode from 'qrcode';
import {useI18n} from '../../i18n/index.js';
import {roomInviteUrl} from '../../services/roomSession.js';

/** QR con el enlace de invitación, generado en el navegador (el enlace no sale a ningún servicio externo). */
export const InviteQr: React.FC<{ roomCode: string }> = ({ roomCode }) => {
  const { t } = useI18n();
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(roomInviteUrl(roomCode), { margin: 1, width: 320, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  return (
    <div className="flex flex-col items-center space-y-2 animate-fadeIn">
      <div className="bg-white p-3 rounded-2xl shadow-xl w-56 h-56 flex items-center justify-center">
        {dataUrl && <img src={dataUrl} alt={t.lobby.invite.qrAlt(roomCode)} className="w-full h-full" />}
      </div>
      <p className="text-xs text-slate-400">{t.lobby.invite.qrHint}</p>
    </div>
  );
};
