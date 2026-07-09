"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Building2, Upload, Banknote, QrCode, Check, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { saveCompany } from "@/lib/actions/company";

type Company = {
  id: string;
  tradingName: string;
  legalName: string;
  document: string;
  stateRegistration: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  bankName: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  pixKey: string | null;
  pixKeyType: "cpf" | "cnpj" | "email" | "phone" | "random";
};

async function generatePixPayload(key: string, keyType: string, merchantName: string, merchantCity: string, amount?: number): Promise<string> {
  const name = merchantName.slice(0, 25).toUpperCase();
  const city = (merchantCity || "SAO PAULO").slice(0, 15).toUpperCase();

  const payloadFormat = "000201";
  const merchantAccount = `0014BR.GOV.BCB.PIX01${String(key.length).padStart(2, "0")}${key}`;
  const merchantInfo = `0026${merchantAccount.length}${merchantAccount}`;
  const category = "52040000";
  const currency = "5303986";
  const country = "5802BR";
  const merchantNameField = `59${String(name.length).padStart(2, "0")}${name}`;
  const merchantCityField = `60${String(city.length).padStart(2, "0")}${city}`;

  let txAmount = "";
  if (amount && amount > 0) {
    const amt = amount.toFixed(2);
    txAmount = `54${String(amt.length).padStart(2, "0")}${amt}`;
  }

  const body = `${merchantInfo}${category}${currency}${country}${merchantNameField}${merchantCityField}${txAmount}`;
  const crcPart = `${payloadFormat}${body}6304`;
  const crc = crc16(crcPart);
  return `${crcPart}${crc}`;
}

function applyCpfMask(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function applyCnpjMask(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function applyCpfCnpjMask(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 11) return applyCpfMask(d);
  return applyCnpjMask(d);
}

function applyCepMask(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

function applyPhoneMask(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export function CompanyClient({ company }: { company: Company | null }) {
  const [tradingName, setTradingName] = useState(company?.tradingName ?? "");
  const [legalName, setLegalName] = useState(company?.legalName ?? "");
  const [document, setDocument] = useState(company?.document ?? "");
  const [stateRegistration, setStateRegistration] = useState(company?.stateRegistration ?? "");
  const [cep, setCep] = useState(company?.cep ?? "");
  const [street, setStreet] = useState(company?.street ?? "");
  const [number, setNumber] = useState(company?.number ?? "");
  const [complement, setComplement] = useState(company?.complement ?? "");
  const [neighborhood, setNeighborhood] = useState(company?.neighborhood ?? "");
  const [city, setCity] = useState(company?.city ?? "");
  const [state, setState] = useState(company?.state ?? "");
  const [phone, setPhone] = useState(company?.phone ?? "");
  const [email, setEmail] = useState(company?.email ?? "");
  const [logo, setLogo] = useState(company?.logo ?? "");
  const [bankName, setBankName] = useState(company?.bankName ?? "");
  const [bankAgency, setBankAgency] = useState(company?.bankAgency ?? "");
  const [bankAccount, setBankAccount] = useState(company?.bankAccount ?? "");
  const [pixKey, setPixKey] = useState(company?.pixKey ?? "");
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "cnpj" | "email" | "phone" | "random">(company?.pixKeyType ?? "random");
  const documentDigits = document.replace(/\D/g, "");
  const isCnpj = documentDigits.length === 14;
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cepTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchAddressByCep = useCallback(async (raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setState(data.uf ?? "");
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cepTimeoutRef.current) clearTimeout(cepTimeoutRef.current);
    cepTimeoutRef.current = setTimeout(() => fetchAddressByCep(cep), 600);
    return () => {
      if (cepTimeoutRef.current) clearTimeout(cepTimeoutRef.current);
    };
  }, [cep, fetchAddressByCep]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const generateQr = useCallback(async () => {
    if (!pixKey.trim()) {
      toast.error("Informe uma chave PIX primeiro");
      return;
    }
    try {
      const payload = await generatePixPayload(pixKey.trim(), pixKeyType, tradingName || "Studio One", city || "SAO PAULO");
      const QR = await import("qrcode");
      const url = await QR.toDataURL(payload, { width: 300, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
      setQrDataUrl(url);
    } catch {
      toast.error("Erro ao gerar QR Code");
    }
  }, [pixKey, pixKeyType, tradingName, city]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set("tradingName", tradingName);
    fd.set("legalName", legalName);
    fd.set("document", document.replace(/\D/g, ""));
    fd.set("stateRegistration", stateRegistration);
    fd.set("cep", cep.replace(/\D/g, ""));
    fd.set("street", street);
    fd.set("number", number);
    fd.set("complement", complement);
    fd.set("neighborhood", neighborhood);
    fd.set("city", city);
    fd.set("state", state);
    fd.set("phone", phone);
    fd.set("email", email);
    fd.set("logo", logo);
    fd.set("bankName", bankName);
    fd.set("bankAgency", bankAgency);
    fd.set("bankAccount", bankAccount);
    fd.set("pixKey", pixKey);
    fd.set("pixKeyType", pixKeyType);
    const result = await saveCompany(null, fd);
    setLoading(false);
    if (result.success) {
      toast.success("Dados salvos");
    } else {
      toast.error("Erro ao salvar");
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <Building2 size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Sprint OS / Dados da Empresa
          </p>
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          <Save size={14} /> {loading ? "Salvando..." : "Salvar"}
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
        <Card>
          <CardHeader>
            <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Identificação</p>
            <CardTitle className="text-display text-xl">Dados da empresa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start gap-6">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-hairline bg-(--surface-2)">
                  {logo ? (
                    <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <Building2 size={32} className="text-muted-foreground/40" />
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} hidden />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload size={12} /> Logo
                </Button>
                {logo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLogo("")}>
                    Remover
                  </Button>
                )}
              </div>

              <div className="grid flex-1 grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome fantasia</Label>
                  <Input value={tradingName} onChange={(e) => setTradingName(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
                </div>
                <div className="col-span-2">
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Razão social</Label>
                  <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
                </div>
                <div>
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {isCnpj ? "CNPJ" : "CPF"}
                  </Label>
                  <Input
                    value={document}
                    onChange={(e) => setDocument(applyCpfCnpjMask(e.target.value))}
                    className="mt-1 border-hairline bg-(--surface-2)"
                    placeholder={isCnpj ? "00.000.000/0000-00" : "000.000.000-00"}
                  />
                </div>
                {isCnpj && (
                  <div>
                    <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Inscrição Estadual</Label>
                    <Input value={stateRegistration} onChange={(e) => setStateRegistration(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Endereço</p>
            <CardTitle className="text-display text-xl">Localização</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">CEP</Label>
              <div className="relative mt-1">
                <Input value={cep} onChange={(e) => setCep(applyCepMask(e.target.value))} className="border-hairline bg-(--surface-2) pr-8" placeholder="00000-000" />
                {cepLoading && (
                  <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Estado</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" readOnly={cepLoading} />
            </div>
            <div className="col-span-2">
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Logradouro</Label>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" readOnly={cepLoading} />
            </div>
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Número</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
            </div>
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Complemento</Label>
              <Input value={complement} onChange={(e) => setComplement(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
            </div>
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Bairro</Label>
              <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" readOnly={cepLoading} />
            </div>
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" readOnly={cepLoading} />
            </div>
            <div className="col-span-2">
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(applyPhoneMask(e.target.value))} className="mt-1 border-hairline bg-(--surface-2)" placeholder="(00) 00000-0000" />
            </div>
            <div className="col-span-2">
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-mono text-[10px] uppercase tracking-widest text-amber-glow">Pagamento</p>
            <CardTitle className="text-display text-xl">Dados bancários & PIX</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Banco</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agência</Label>
                <Input value={bankAgency} onChange={(e) => setBankAgency(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Conta</Label>
                <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="mt-1 border-hairline bg-(--surface-2)" />
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-6">
              <div className="flex flex-1 flex-col gap-3">
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Chave PIX</Label>
                <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Sua chave PIX" className="border-hairline bg-(--surface-2)" />
                <div>
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tipo da chave</Label>
                  <Select value={pixKeyType} onValueChange={(v) => setPixKeyType(v as typeof pixKeyType)}>
                    <SelectTrigger className="mt-1 border-hairline bg-(--surface-2)">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="random">Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={generateQr} className="w-fit">
                  <QrCode size={14} /> Gerar QR Code PIX
                </Button>
              </div>

              {qrDataUrl && (
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <div className="flex size-[180px] items-center justify-center rounded-2xl border border-hairline bg-white p-3">
                    <img src={qrDataUrl} alt="QR Code PIX" className="h-full w-full" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-glow">
                    <Check size={10} /> QR Code gerado
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  );
}
