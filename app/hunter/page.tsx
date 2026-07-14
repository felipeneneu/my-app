"use client";

import { useState, useCallback, useEffect } from "react";
import { generateAccessToken } from "@/lib/actions/hunter-mobile";
import { Swords, QrCode, Smartphone, RefreshCw } from "lucide-react";

export default function HunterAccessPage() {
  const [token, setToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("hunter_token");
    if (saved) setStoredToken(saved);
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const result = await generateAccessToken("Mobile Access");
      if (!result.success) return;

      const fullUrl = `${window.location.origin}${result.data.url}`;
      setToken(fullUrl);

      localStorage.setItem("hunter_token", result.data.token);
      setStoredToken(result.data.token);

      const QR = await import("qrcode");
      const url = await QR.toDataURL(fullUrl, {
        width: 280, margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    localStorage.removeItem("hunter_token");
    setStoredToken(null);
    setToken(null);
    setQrDataUrl(null);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="mb-8 flex items-center gap-3">
        <Swords size={28} className="text-violet-400" />
        <h1 className="text-xl font-bold text-white">Hunter Mobile</h1>
      </div>

      <p className="mb-8 max-w-xs text-sm text-zinc-400">
        Gere um QR Code, escaneie com seu celular e acompanhe suas quests, hábitos e evolução em qualquer lugar.
      </p>

      {storedToken && !qrDataUrl && (
        <p className="mb-4 text-xs text-zinc-500">
          Token salvo neste dispositivo. Gere um novo para atualizar.
        </p>
      )}

      {!qrDataUrl ? (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <QrCode size={18} />
          {generating ? "Gerando…" : "Gerar QR Code de Acesso"}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code de acesso" className="h-56 w-56" />
          </div>
          <p className="text-xs text-zinc-500">Escaneie com a câmera do celular</p>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              <RefreshCw size={14} /> Novo QR
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-4 py-2 text-xs text-zinc-400 hover:text-red-400"
            >
              Limpar token
            </button>
          </div>
          {storedToken && (
            <a
              href={`/hunter/${storedToken}`}
              className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
            >
              <Smartphone size={14} /> Abrir direto
            </a>
          )}
        </div>
      )}

      <p className="mt-12 text-[10px] text-zinc-700">
        O token fica salvo no navegador. Sem autenticação real — acesso temporário.
      </p>
    </div>
  );
}
