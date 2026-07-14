"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, User, Mail, Phone, Building2, ExternalLink,
  Plus, Save, StickyNote, Trash2, Edit3, MapPin, Loader2, FileDigit,
  PhoneCall, MailQuestion, Calendar, MessageSquare, MoreHorizontal, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateClient, deleteClient, type Client } from "@/lib/actions/clients";
import { createClientContact, deleteClientContact, type ClientContact } from "@/lib/actions/client-contacts";
import { createAddress, deleteAddress, type Address } from "@/lib/actions/addresses";
import { maskCPF, maskCNPJ, maskCEP, maskPhone, unmask } from "@/lib/masks";

type Project = {
  id: string;
  name: string;
  status: string;
  price: number;
  startDate: string;
};

const contactIcons: Record<string, typeof PhoneCall> = {
  call: PhoneCall, email: MailQuestion, meeting: Calendar, note: MessageSquare, other: MessageSquare,
};

const contactLabels: Record<string, string> = {
  call: "Ligação", email: "E-mail", meeting: "Reunião", note: "Anotação", other: "Outro",
};

export function ClientDetailClient({
  client: initial,
  projects,
  contacts: initialContacts,
  addresses: initialAddresses,
}: {
  client: Client;
  projects: Project[];
  contacts: ClientContact[];
  addresses: Address[];
}) {
  const router = useRouter();
  const [client, setClient] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [form, setForm] = useState({
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    document: client.document ?? "",
    documentType: (client.documentType ?? "cpf") as "cpf" | "cnpj",
    cep: client.cep ?? "",
    street: client.street ?? "",
    number: client.number ?? "",
    neighborhood: client.neighborhood ?? "",
    city: client.city ?? "",
    state: client.state ?? "",
    notes: client.notes ?? "",
  });

  const [contacts, setContacts] = useState(initialContacts);
  const [addressList, setAddressList] = useState(initialAddresses);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [contactForm, setContactForm] = useState({ type: "note" as ClientContact["type"], subject: "", description: "" });
  const [addressForm, setAddressForm] = useState({ label: "Principal", cep: "", street: "", number: "", neighborhood: "", city: "", state: "" });
  const [addrLoadingCep, setAddrLoadingCep] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // ── CEP auto-fill for address form ──
  const fetchAddrCep = useCallback(async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setAddrLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.erro) return;
      setAddressForm((f) => ({
        ...f,
        street: data.logradouro ?? f.street,
        neighborhood: data.bairro ?? f.neighborhood,
        city: data.localidade ?? f.city,
        state: data.uf ?? f.state,
      }));
    } catch {
    } finally {
      setAddrLoadingCep(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchAddrCep(addressForm.cep), 600);
    return () => clearTimeout(timer);
  }, [addressForm.cep, fetchAddrCep]);

  async function handleAddContact() {
    if (!contactForm.subject.trim()) return;
    setSavingContact(true);
    try {
      await createClientContact({ clientId: client.id, ...contactForm });
      const updated = await import("@/lib/actions/client-contacts").then(m => m.getClientContacts(client.id));
      setContacts(updated);
      setContactForm({ type: "note", subject: "", description: "" });
      setShowContactForm(false);
      toast.success("Contato registrado");
    } catch {
      toast.error("Erro ao registrar contato");
    } finally {
      setSavingContact(false);
    }
  }

  async function handleDeleteContact(id: string) {
    if (!confirm("Remover este contato?")) return;
    await deleteClientContact(id, client.id);
    setContacts(prev => prev.filter(c => c.id !== id));
    toast.success("Contato removido");
  }

  async function handleAddAddress() {
    if (!addressForm.street.trim() && !addressForm.cep.trim()) return;
    setSavingAddress(true);
    try {
      await createAddress({ clientId: client.id, ...addressForm });
      const updated = await import("@/lib/actions/addresses").then(m => m.getClientAddresses(client.id));
      setAddressList(updated);
      setAddressForm({ label: "Principal", cep: "", street: "", number: "", neighborhood: "", city: "", state: "" });
      setShowAddressForm(false);
      toast.success("Endereço adicionado");
    } catch {
      toast.error("Erro ao adicionar endereço");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm("Remover este endereço?")) return;
    await deleteAddress(id, client.id);
    setAddressList(prev => prev.filter(a => a.id !== id));
    toast.success("Endereço removido");
  }

  const statusColor: Record<string, string> = {
    active: "bg-emerald-glow",
    paused: "bg-amber-glow",
    completed: "bg-sky-glow",
    cancelled: "bg-muted-foreground/50",
  };

  // ── CEP auto-fill (ViaCEP) ──
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

  // ── Document mask ──
  const docValue = form.documentType === "cpf" ? maskCPF(form.document) : maskCNPJ(form.document);

  function handleDocChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const maxLen = form.documentType === "cpf" ? 11 : 14;
    setForm((f) => ({ ...f, document: digits.slice(0, maxLen) }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await updateClient(client.id, {
      ...form,
      phone: unmask(form.phone),
      document: form.document,
    });
    setClient(prev => ({ ...prev, ...form, phone: unmask(form.phone) }));
    setSaving(false);
    setEditing(false);
    toast.success("Cliente atualizado");
  }

  async function handleDelete() {
    await deleteClient(client.id);
    toast.success("Cliente removido");
    router.push("/adm/clients");
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm/clients" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Clientes
          </Link>
          <User size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {client.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            <Edit3 size={14} /> {editing ? "Cancelar" : "Editar"}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dados do cliente</p>
              <CardTitle className="text-display text-xl">Informações</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome</Label>
                      <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</Label>
                      <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
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
                        <FileDigit size={12} className="inline mr-1" />
                        Documento
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

                  {/* Address */}
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
                        <Input
                          value={form.number}
                          onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))}
                          placeholder="Nº"
                        />
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
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                      <Save size={14} /> {saving ? "Salvando…" : "Salvar alterações"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditing(false);
                      setForm({
                        name: client.name,
                        email: client.email ?? "",
                        phone: client.phone ?? "",
                        document: client.document ?? "",
                        documentType: (client.documentType ?? "cpf") as "cpf" | "cnpj",
                        cep: client.cep ?? "",
                        street: client.street ?? "",
                        number: client.number ?? "",
                        neighborhood: client.neighborhood ?? "",
                        city: client.city ?? "",
                        state: client.state ?? "",
                        notes: client.notes ?? "",
                      });
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome</p>
                      <p className="text-sm text-foreground mt-0.5">{client.name}</p>
                    </div>
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</p>
                      <p className="text-sm text-foreground mt-0.5">{client.email || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Telefone</p>
                      <p className="text-sm text-foreground mt-0.5">{client.phone ? maskPhone(client.phone) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {client.documentType === "cnpj" ? "CNPJ" : "CPF"}
                      </p>
                      <p className="text-sm text-foreground mt-0.5">
                        {client.document
                          ? client.documentType === "cnpj"
                            ? maskCNPJ(unmask(client.document))
                            : maskCPF(unmask(client.document))
                          : "—"}
                      </p>
                    </div>
                  </div>
                  {(client.street || client.cep) && (
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} /> Endereço
                      </p>
                      <p className="text-sm text-foreground mt-0.5">
                        {[client.street, client.number, client.neighborhood, client.city, client.state]
                          .filter(Boolean)
                          .join(", ")}
                        {client.cep && ` — ${maskCEP(client.cep)}`}
                      </p>
                    </div>
                  )}
                  {client.notes && (
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Observações</p>
                      <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] text-muted-foreground">Cadastrado em {new Date(client.createdAt).toLocaleDateString("pt-BR")}</p>
                    <span className="text-muted-foreground/30">·</span>
                    <button onClick={handleDelete} className="text-[11px] text-rose-glow/70 hover:text-rose-glow transition-colors">
                      Remover cliente
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Projetos vinculados</p>
              <CardTitle className="text-display text-xl">Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum projeto vinculado a este cliente.</p>
              ) : (
                <div className="flex flex-col divide-y divide-hairline">
                  {projects.map((p) => (
                    <Link key={p.id} href={`/adm/${p.id}`} className="flex items-center gap-3 py-3 group hover:bg-(--surface-2) -mx-4 px-4 rounded-lg transition-colors">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor[p.status] || "bg-muted-foreground/50"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.startDate} · {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                      <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="flex flex-col gap-6">
          {/* ── Contacts History ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Histórico</p>
                  <CardTitle className="text-display text-xl">Contatos</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowContactForm(!showContactForm)}>
                  <Plus size={12} /> {showContactForm ? "Cancelar" : "Novo"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* New contact form */}
              {showContactForm && (
                <div className="mb-4 space-y-3 rounded-lg border border-hairline p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</Label>
                      <Select value={contactForm.type} onValueChange={(v) => setContactForm(f => ({ ...f, type: v as ClientContact["type"] }))}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["call", "email", "meeting", "note", "other"] as const).map(t => (
                            <SelectItem key={t} value={t} className="text-xs">{contactLabels[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Assunto</Label>
                      <Input
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(f => ({ ...f, subject: e.target.value }))}
                        placeholder="Ex: Proposta enviada"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Descrição</Label>
                    <Textarea
                      value={contactForm.description}
                      onChange={(e) => setContactForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>
                  <Button size="sm" onClick={handleAddContact} disabled={savingContact || !contactForm.subject.trim()}>
                    {savingContact ? "Salvando…" : "Registrar"}
                  </Button>
                </div>
              )}

              {contacts.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Nenhum contato registrado.</p>
              ) : (
                <div className="flex flex-col divide-y divide-hairline">
                  {contacts.map((c) => {
                    const Icon = contactIcons[c.type] ?? MessageSquare;
                    return (
                      <div key={c.id} className="group flex items-start gap-3 py-3">
                        <Icon size={14} className="mt-0.5 shrink-0 text-emerald-glow" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{c.subject}</span>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{contactLabels[c.type]}</span>
                          </div>
                          {c.description && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{c.description}</p>
                          )}
                          <p className="mt-0.5 text-[9px] text-muted-foreground/50">
                            {new Date(c.createdAt).toLocaleDateString("pt-BR")} {new Date(c.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-glow transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Addresses ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Endereços</p>
                  <CardTitle className="text-display text-xl">Endereços</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowAddressForm(!showAddressForm)}>
                  <Plus size={12} /> {showAddressForm ? "Cancelar" : "Adicionar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddressForm && (
                <div className="mb-4 space-y-3 rounded-lg border border-hairline p-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Identificação</Label>
                    <Input
                      value={addressForm.label}
                      onChange={(e) => setAddressForm(f => ({ ...f, label: e.target.value }))}
                      placeholder="Principal, Cobrança, Entrega…"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">CEP</Label>
                      <div className="relative">
                        <Input
                          value={maskCEP(addressForm.cep)}
                          onChange={(e) => setAddressForm(f => ({ ...f, cep: unmask(e.target.value).slice(0, 8) }))}
                          placeholder="00000-000"
                          className="h-9 text-xs"
                        />
                        {addrLoadingCep && (
                          <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Número</Label>
                      <Input
                        value={addressForm.number}
                        onChange={(e) => setAddressForm(f => ({ ...f, number: e.target.value }))}
                        placeholder="Nº"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Logradouro</Label>
                      <Input
                        value={addressForm.street}
                        onChange={(e) => setAddressForm(f => ({ ...f, street: e.target.value }))}
                        readOnly={addrLoadingCep}
                        className={`h-9 text-xs ${addrLoadingCep ? "opacity-60" : ""}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Bairro</Label>
                      <Input
                        value={addressForm.neighborhood}
                        onChange={(e) => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))}
                        readOnly={addrLoadingCep}
                        className={`h-9 text-xs ${addrLoadingCep ? "opacity-60" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Cidade</Label>
                      <Input
                        value={addressForm.city}
                        onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))}
                        readOnly={addrLoadingCep}
                        className={`h-9 text-xs ${addrLoadingCep ? "opacity-60" : ""}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Estado</Label>
                      <Input
                        value={addressForm.state}
                        onChange={(e) => setAddressForm(f => ({ ...f, state: e.target.value }))}
                        readOnly={addrLoadingCep}
                        className={`h-9 text-xs ${addrLoadingCep ? "opacity-60" : ""}`}
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <Button size="sm" onClick={handleAddAddress} disabled={savingAddress}>
                    {savingAddress ? "Salvando…" : "Adicionar"}
                  </Button>
                </div>
              )}

              {addressList.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Nenhum endereço cadastrado.</p>
              ) : (
                <div className="flex flex-col divide-y divide-hairline">
                  {addressList.map((a) => (
                    <div key={a.id} className="group flex items-start gap-3 py-3">
                      <Home size={14} className="mt-0.5 shrink-0 text-violet-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{a.label}</span>
                          {a.cep && <span className="text-[9px] text-muted-foreground">{maskCEP(a.cep)}</span>}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {[a.street, a.number, a.neighborhood, a.city, a.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(a.id)}
                        className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-glow transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
