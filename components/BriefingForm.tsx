"use client";

import { useState } from "react";
import { saveBriefing } from "@/lib/actions/briefing";
import type { BriefingData } from "@/lib/data/briefing";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Save, Eye, PenLine, Plus, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ATRIBUTO_LABELS: Record<string, [string, string]> = {
  tradicional_vs_moderna: ["Tradicional", "Moderna"],
  seria_vs_divertida: ["Séria", "Divertida"],
  acessivel_vs_exclusiva: ["Acessível", "Exclusiva"],
  feminina_vs_masculina: ["Feminina", "Masculina"],
  jovem_vs_madura: ["Jovem", "Madura"],
  discreta_vs_ousada: ["Discreta", "Ousada"],
  tecnica_vs_descontraida: ["Técnica", "Descontraída"],
  rebelde_vs_corporativa: ["Rebelde", "Corporativa"],
  luxuosa_vs_popular: ["Luxuosa", "Popular"],
  artesanal_vs_industrial: ["Artesanal", "Industrial"],
  delicada_vs_robusta: ["Delicada", "Robusta"],
};

type Props = {
  id: string;
  clientName: string;
  projectName: string;
  initial: BriefingData;
};

export default function BriefingForm({ id, clientName, projectName, initial }: Props) {
  const router = useRouter();
  const [data, setData] = useState<BriefingData>(initial);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"edit" | "view">("edit");

  function patch(path: string[], value: unknown) {
    setData((prev) => {
      const next = structuredClone(prev);
      let obj: Record<string, unknown> = next as never;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  }

  function setConcorrente(i: number, val: string) {
    setData((prev) => {
      const conc = [...prev.bloco_1_estrutural.concorrentes];
      conc[i] = val;
      return { ...prev, bloco_1_estrutural: { ...prev.bloco_1_estrutural, concorrentes: conc } };
    });
  }

  function addConcorrente() {
    setData((prev) => ({
      ...prev,
      bloco_1_estrutural: {
        ...prev.bloco_1_estrutural,
        concorrentes: [...prev.bloco_1_estrutural.concorrentes, ""],
      },
    }));
  }

  function removeConcorrente(i: number) {
    setData((prev) => ({
      ...prev,
      bloco_1_estrutural: {
        ...prev.bloco_1_estrutural,
        concorrentes: prev.bloco_1_estrutural.concorrentes.filter((_, j) => j !== i),
      },
    }));
  }

  function setAtributo(key: string, val: number) {
    setData((prev) => ({
      ...prev,
      bloco_2_ramificacao: {
        ...prev.bloco_2_ramificacao,
        atributos_visuais_escala: {
          ...prev.bloco_2_ramificacao.atributos_visuais_escala,
          [key]: val,
        },
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    await saveBriefing(id, data);
    setSaving(false);
    router.refresh();
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm/briefing" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Briefings
          </Link>
          <FileText size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Briefings / {projectName || clientName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setMode(mode === "edit" ? "view" : "edit")}>
            {mode === "edit" ? <Eye size={14} /> : <PenLine size={14} />}
            {mode === "edit" ? "Visualizar" : "Editar"}
          </Button>
          {mode === "edit" && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Salvando..." : "Salvar Briefing"}
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-8">
        {mode === "view" ? (
          <BriefingView data={data} clientName={clientName} />
        ) : (
          <Tabs defaultValue="estrutural" className="w-full">
            <TabsList variant="line" className="w-full border-b border-hairline rounded-none gap-0 h-auto">
              <TabsTrigger value="estrutural" className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.1em]">
                <span className="text-[9px]">◆</span> 01 · Estrutural
              </TabsTrigger>
              <TabsTrigger value="ramificacao" className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.1em]">
                <span className="text-[9px]">◈</span> 02 · Ramificação
              </TabsTrigger>
              <TabsTrigger value="moodboard" className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.1em]">
                <span className="text-[9px]">◇</span> 03 · Moodboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="estrutural" className="py-6">
              <div className="space-y-6">
                <Section title="O Que" glow="text-emerald-glow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Atuação da empresa" value={getVal(data, ["bloco_1_estrutural", "o_que", "atuacao_empresa"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "o_que", "atuacao_empresa"], v)} />
                    <Field label="Objetivos" value={getVal(data, ["bloco_1_estrutural", "o_que", "objetivos"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "o_que", "objetivos"], v)} />
                    <Field label="Desafios" value={getVal(data, ["bloco_1_estrutural", "o_que", "desafios"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "o_que", "desafios"], v)} />
                    <div>
                      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Aplicabilidade
                      </Label>
                      <div className="mt-2 flex gap-6">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                          <Checkbox
                            checked={data.bloco_1_estrutural.o_que.aplicabilidade.impresso}
                            onCheckedChange={(val) => patch(["bloco_1_estrutural", "o_que", "aplicabilidade", "impresso"], val)}
                          />
                          Impresso
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                          <Checkbox
                            checked={data.bloco_1_estrutural.o_que.aplicabilidade.digital}
                            onCheckedChange={(val) => patch(["bloco_1_estrutural", "o_que", "aplicabilidade", "digital"], val)}
                          />
                          Digital
                        </label>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Como" glow="text-emerald-glow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Métodos e processos" value={getVal(data, ["bloco_1_estrutural", "como", "metodos_processos"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "como", "metodos_processos"], v)} />
                    <Field label="Competências" value={getVal(data, ["bloco_1_estrutural", "como", "competencias"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "como", "competencias"], v)} />
                    <Field label="Posicionamento de preço" value={getVal(data, ["bloco_1_estrutural", "como", "posicionamento_preco"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "como", "posicionamento_preco"], v)} />
                  </div>
                </Section>

                <Section title="Por Que" glow="text-emerald-glow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Motivos de abertura" value={getVal(data, ["bloco_1_estrutural", "por_que", "motivos_abertura"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "por_que", "motivos_abertura"], v)} />
                    <Field label="Propósito" value={getVal(data, ["bloco_1_estrutural", "por_que", "proposito"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "por_que", "proposito"], v)} />
                  </div>
                </Section>

                <Section title="Cliente Ideal" glow="text-emerald-glow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Características" value={getVal(data, ["bloco_1_estrutural", "cliente_ideal", "caracteristicas"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "cliente_ideal", "caracteristicas"], v)} />
                    <Field label="Demografia" value={getVal(data, ["bloco_1_estrutural", "cliente_ideal", "demografia"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "cliente_ideal", "demografia"], v)} />
                    <Field label="Dores" value={getVal(data, ["bloco_1_estrutural", "cliente_ideal", "dores"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "cliente_ideal", "dores"], v)} />
                  </div>
                </Section>

                <Section title="Entregas" glow="text-emerald-glow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Entrega racional" value={getVal(data, ["bloco_1_estrutural", "entregas", "entrega_racional"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "entregas", "entrega_racional"], v)} />
                    <Field label="Entrega emocional" value={getVal(data, ["bloco_1_estrutural", "entregas", "entrega_emocional"]) as string} onChange={(v) => patch(["bloco_1_estrutural", "entregas", "entrega_emocional"], v)} />
                  </div>
                </Section>

                <Section title="Concorrentes" glow="text-emerald-glow">
                  <div className="space-y-2">
                    {data.bloco_1_estrutural.concorrentes.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={c}
                          onChange={(e) => setConcorrente(i, e.target.value)}
                          placeholder={`Concorrente ${i + 1}`}
                          className="border-hairline bg-(--surface-2)"
                        />
                        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => removeConcorrente(i)}>
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addConcorrente}>
                      <Plus size={12} /> Adicionar concorrente
                    </Button>
                  </div>
                </Section>
              </div>
            </TabsContent>

            <TabsContent value="ramificacao" className="py-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Direção visual</p>
                    <CardTitle className="text-display text-xl">Atributos Visuais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {Object.entries(ATRIBUTO_LABELS).map(([key, [esq, dir]]) => {
                        const currentVal = data.bloco_2_ramificacao.atributos_visuais_escala[key] ?? 3;
                        return (
                          <div key={key}>
                            <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              {esq} · {dir}
                            </Label>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="w-16 text-right text-[10px] text-muted-foreground">{esq}</span>
                              <ToggleGroup
                                value={[String(currentVal)]}
                                onValueChange={(val) => {
                                  const v = val as string[];
                                  if (v.length > 0) setAtributo(key, Number(v[0]));
                                }}
                                spacing={0}
                                className="gap-0 border border-hairline rounded-lg"
                              >
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <ToggleGroupItem
                                    key={n}
                                    value={String(n)}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 w-7 rounded-none border-0 border-r border-hairline text-[11px] font-bold last:border-r-0 data-[pressed]:bg-foreground data-[pressed]:text-(--surface-0) data-[pressed]:hover:bg-foreground"
                                  >
                                    {n}
                                  </ToggleGroupItem>
                                ))}
                              </ToggleGroup>
                              <span className="w-16 text-[10px] text-muted-foreground">{dir}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Referências</p>
                    <CardTitle className="text-display text-xl">Contexto da Marca</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Significados do nome" value={getVal(data, ["bloco_2_ramificacao", "significados"]) as string} onChange={(v) => patch(["bloco_2_ramificacao", "significados"], v)} rows={4} />
                    <Field label="História da empresa" value={getVal(data, ["bloco_2_ramificacao", "historia"]) as string} onChange={(v) => patch(["bloco_2_ramificacao", "historia"], v)} rows={4} />
                    <Field label="Símbolos" value={getVal(data, ["bloco_2_ramificacao", "simbolos"]) as string} onChange={(v) => patch(["bloco_2_ramificacao", "simbolos"], v)} rows={4} />
                    <Field label="Objeto" value={getVal(data, ["bloco_2_ramificacao", "objeto"]) as string} onChange={(v) => patch(["bloco_2_ramificacao", "objeto"], v)} rows={4} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="moodboard" className="py-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <p className="text-mono text-[10px] uppercase tracking-widest text-amber-glow">Direcionamento criativo</p>
                    <CardTitle className="text-display text-xl">Moodboard & Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Considerar" value={getVal(data, ["bloco_3_moodboard_insights", "considerar"]) as string} onChange={(v) => patch(["bloco_3_moodboard_insights", "considerar"], v)} rows={4} />
                      <Field label="Desconsiderar" value={getVal(data, ["bloco_3_moodboard_insights", "desconsiderar"]) as string} onChange={(v) => patch(["bloco_3_moodboard_insights", "desconsiderar"], v)} rows={4} />
                    </div>
                    <Field label="Elementos dos concorrentes" value={getVal(data, ["bloco_3_moodboard_insights", "elementos_concorrentes"]) as string} onChange={(v) => patch(["bloco_3_moodboard_insights", "elementos_concorrentes"], v)} rows={4} />
                    <Field label="Ideia central" value={getVal(data, ["bloco_3_moodboard_insights", "ideia_central"]) as string} onChange={(v) => patch(["bloco_3_moodboard_insights", "ideia_central"], v)} rows={3} />
                    <Field label="Observações gerais" value={getVal(data, ["bloco_3_moodboard_insights", "observacoes_gerais"]) as string} onChange={(v) => patch(["bloco_3_moodboard_insights", "observacoes_gerais"], v)} rows={4} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function getVal(data: BriefingData, path: string[]): unknown {
  let obj: unknown = data;
  for (const key of path) {
    obj = (obj as Record<string, unknown>)[key];
  }
  return obj;
}

function Field({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  if (rows && rows > 2) {
    return (
      <div>
        <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="mt-1 border-hairline bg-(--surface-2)"
        />
      </div>
    );
  }
  return (
    <div>
      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 border-hairline bg-(--surface-2)"
      />
    </div>
  );
}

function Section({ title, glow, children }: { title: string; glow: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <p className={`text-mono text-[10px] uppercase tracking-widest ${glow}`}>{title}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BriefingView({ data, clientName }: { data: BriefingData; clientName: string }) {
  const { bloco_1_estrutural: b1, bloco_2_ramificacao: b2, bloco_3_moodboard_insights: b3 } = data;

  function Field({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
      <div>
        <p className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-foreground">{value}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between border-b border-hairline pb-4">
        <div>
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Briefing de Projeto</p>
          <h2 className="text-display mt-1 text-2xl text-foreground">
            {data.metadados.marca_projeto || clientName}
          </h2>
        </div>
        <p className="text-[10px] text-muted-foreground">{data.metadados.data_preenchimento}</p>
      </div>

      <div>
        <p className="mb-4 text-mono text-[10px] uppercase tracking-widest text-emerald-glow">01 · ESTRUTURAL</p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-hairline bg-(--surface-1) p-4">
            <p className="text-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">O Quê</p>
            <Field label="Atuação" value={b1.o_que.atuacao_empresa} />
            <Field label="Objetivos" value={b1.o_que.objetivos} />
            <Field label="Desafios" value={b1.o_que.desafios} />
            <div>
              <p className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Aplicabilidade</p>
              <div className="mt-1 flex gap-2">
                {b1.o_que.aplicabilidade.impresso && <Badge variant="outline">Impresso</Badge>}
                {b1.o_que.aplicabilidade.digital && <Badge variant="outline">Digital</Badge>}
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-hairline bg-(--surface-1) p-4">
            <p className="text-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">Como</p>
            <Field label="Métodos" value={b1.como.metodos_processos} />
            <Field label="Competências" value={b1.como.competencias} />
            <Field label="Preço" value={b1.como.posicionamento_preco} />
          </div>
          <div className="space-y-4 rounded-xl border border-hairline bg-(--surface-1) p-4">
            <p className="text-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">Por Quê</p>
            <Field label="Motivos" value={b1.por_que.motivos_abertura} />
            <Field label="Propósito" value={b1.por_que.proposito} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-hairline bg-(--surface-1) p-4">
            <p className="text-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">Cliente Ideal</p>
            <Field label="Características" value={b1.cliente_ideal.caracteristicas} />
            <Field label="Demografia" value={b1.cliente_ideal.demografia} />
            <Field label="Dores" value={b1.cliente_ideal.dores} />
          </div>
          <div className="space-y-4 rounded-xl border border-hairline bg-(--surface-1) p-4">
            <p className="text-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">Entregas</p>
            <Field label="Racional" value={b1.entregas.entrega_racional} />
            <Field label="Emocional" value={b1.entregas.entrega_emocional} />
          </div>
          <div className="space-y-4 rounded-xl border border-hairline bg-(--surface-1) p-4">
            <p className="text-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">Concorrentes</p>
            {b1.concorrentes.filter(Boolean).length === 0 && (
              <p className="text-[11px] italic text-muted-foreground">Nenhum concorrente listado</p>
            )}
            {b1.concorrentes.filter(Boolean).map((c, i) => (
              <p key={i} className="text-sm text-foreground">{c}</p>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-4 text-mono text-[10px] uppercase tracking-widest text-violet-glow">02 · RAMIFICAÇÃO</p>

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.entries(b2.atributos_visuais_escala).map(([key, val]) => {
            const labels = ATRIBUTO_LABELS[key] || [key, ""];
            return (
              <div key={key} className="border-t border-hairline pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">{labels[0]}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`block h-3 w-3 ${val >= n ? "bg-foreground" : "bg-foreground/10"}`}
                      />
                    ))}
                  </div>
                  <span className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">{labels[1]}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Significados" value={b2.significados} />
          <Field label="História" value={b2.historia} />
          <Field label="Símbolos" value={b2.simbolos} />
          <Field label="Objeto" value={b2.objeto} />
        </div>
      </div>

      <div>
        <p className="mb-4 text-mono text-[10px] uppercase tracking-widest text-amber-glow">03 · MOODBOARD & INSIGHTS</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Considerar" value={b3.considerar} />
          <Field label="Desconsiderar" value={b3.desconsiderar} />
        </div>
        <div className="mt-6 space-y-6">
          <Field label="Elementos dos concorrentes" value={b3.elementos_concorrentes} />
          <Field label="Ideia central" value={b3.ideia_central} />
          <Field label="Observações" value={b3.observacoes_gerais} />
        </div>
      </div>

      <div className="border-t border-hairline pt-4 text-center text-mono text-[10px] text-muted-foreground">
        Sprint OS · Briefing de Projeto · {data.metadados.data_preenchimento}
      </div>
    </div>
  );
}

export { BriefingView };
