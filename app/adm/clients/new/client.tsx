"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, User, Save, Loader2, FileDigit, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/actions/clients";
import { maskCPF, maskCNPJ, maskCEP, maskPhone, unmask } from "@/lib/masks";

export function NewClientClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    documentType: "cpf" as "cpf" | "cnpj",
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: "",
  });

  const fetchCep = useCallback(async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.erro) return;
      setForm((f) => ({
        ...f,
        street: data.logradouro ?? f.street,
        neighborhood: data.bairro ?? f.neighborhood,
        city: data.localidade ?? f.city,
        state: data.uf ?? f.state,
      }));
    } catch {
    } finally {
      setLoadingCep(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchCep(form.cep), 600);
    return () => clearTimeout(timer);
  }, [form.cep, fetchCep]);

  const docValue = form.documentType === "cpf" ? maskCPF(form.document) : maskCNPJ(form.document);

  function handleDocChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const maxLen = form.documentType === "cpf" ? 11 : 14;
    setForm((f) => ({ ...f, document: digits.slice(0, maxLen) }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const client = await createClient({
        ...form,
        document: form.document,
        phone: unmask(form.phone),
      });
      toast.success("Cliente criado com sucesso!");
      router.push(`/adm/clients/${client.id}`);
    } catch {
      toast.error("Erro ao criar cliente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm/clients" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Clientes
          </Link>
          <User size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Novo Cliente</p>
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={saving || !form.name.trim()}>
          <Save size={14} /> {saving ? "Criando…" : "Criar Cliente"}
        </Button>
      </header>

      <section className="mx-auto max-w-2xl px-8 py-6">
        <Card>
          <CardHeader>
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dados do cliente</p>
            <CardTitle className="text-display text-xl">Informações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do cliente" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Telefone</Label>
                <Input
                  value={maskPhone(form.phone)}
                  onChange={(e) => setForm(f => ({ ...f, phone: unmask(e.target.value).slice(0, 11) }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <FileDigit size={12} className="inline mr-1" /> Documento
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={form.documentType}
                    onValueChange={(v) => setForm(f => ({ ...f, documentType: v as "cpf" | "cnpj", document: "" }))}
                  >
                    <SelectTrigger className="w-[90px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={docValue}
                    onChange={(e) => handleDocChange(e.target.value)}
                    placeholder={form.documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-4 mt-2">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1">
                <MapPin size={12} /> Endereço
              </p>
              <div className="grid grid-cols-[1fr_100px] gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">CEP</Label>
                  <div className="relative">
                    <Input
                      value={maskCEP(form.cep)}
                      onChange={(e) => setForm(f => ({ ...f, cep: unmask(e.target.value).slice(0, 8) }))}
                      placeholder="00000-000"
                    />
                    {loadingCep && (
                      <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Número</Label>
                  <Input value={form.number} onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))} placeholder="Nº" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Logradouro</Label>
                  <Input
                    value={form.street}
                    onChange={(e) => setForm(f => ({ ...f, street: e.target.value }))}
                    readOnly={loadingCep}
                    className={loadingCep ? "opacity-60" : ""}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Bairro</Label>
                  <Input
                    value={form.neighborhood}
                    onChange={(e) => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                    readOnly={loadingCep}
                    className={loadingCep ? "opacity-60" : ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cidade</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    readOnly={loadingCep}
                    className={loadingCep ? "opacity-60" : ""}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Estado</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))}
                    readOnly={loadingCep}
                    className={loadingCep ? "opacity-60" : ""}
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
