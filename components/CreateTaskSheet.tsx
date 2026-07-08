"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "O nome da tarefa é obrigatório"),
  projectId: z.string().min(1, "Selecione um projeto"),
  blockType: z.enum(["deep_focus", "meeting", "deadline"]),
  dueDate: z.string().min(1, "A data de entrega é obrigatória"),
});

type FormValues = z.infer<typeof formSchema>;

const blockTypeLabels: Record<FormValues["blockType"], string> = {
  deep_focus: "Foco Profundo",
  meeting: "Reunião",
  deadline: "Prazo",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  projects: { id: string; name: string }[];
  onNewProject?: () => void;
}

export function CreateTaskSheet({ open, onOpenChange, defaultDate, projects, onNewProject }: Props) {
  const router = useRouter();

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", projectId: "", blockType: "deep_focus", dueDate: defaultDate ?? "" },
  });

  const onSubmit = useCallback(async (data: FormValues) => {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("projectId", data.projectId);
    formData.set("blockType", data.blockType);
    formData.set("dueDate", data.dueDate);

    const { createTask } = await import("@/lib/actions/tasks");
    const result = await createTask(null, formData);

    if (result.success) {
      reset();
      onOpenChange(false);
      router.refresh();
    }
  }, [reset, onOpenChange, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Criar tarefa</SheetTitle>
          <SheetDescription>
            Adicione uma nova entrega, reunião ou prazo à sua agenda.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-4 pt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Nome da entrega / tarefa</Label>
            <Input id="title" {...register("title")} placeholder="Ex: Landing page Pizzaria" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Projeto / Cliente</Label>
            <Controller control={control} name="projectId" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  <div className="border-t border-hairline mt-1 pt-1">
                    <button type="button" onClick={onNewProject}
                      className="flex w-full items-center gap-2 px-1.5 py-1.5 text-sm text-emerald-glow hover:bg-accent rounded-md">
                      <Plus size={14} /> Novo projeto
                    </button>
                  </div>
                </SelectContent>
              </Select>
            )} />
            {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo de bloco</Label>
            <Controller control={control} name="blockType" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(blockTypeLabels) as [FormValues["blockType"], string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.blockType && <p className="text-xs text-destructive">{errors.blockType.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">Data de entrega</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Criando…" : "Criar tarefa"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}