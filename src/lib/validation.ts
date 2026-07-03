import { z } from "zod";
import { STORY_POINT_OPTIONS } from "@/lib/types";
import { toLocalIsoDate } from "@/lib/time/format";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const actionTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120, "Nome muito longo"),
});

export type ActionTypeInput = z.infer<typeof actionTypeSchema>;

export const linkedTaskSchema = z.object({
  type: z.enum(["jira", "movidesk"]),
  reference: z.string().min(1, "Informe o link ou referência").max(300),
  storyPoints: z.union(
    STORY_POINT_OPTIONS.map((points) => z.literal(points)) as [
      z.ZodLiteral<(typeof STORY_POINT_OPTIONS)[number]>,
      ...z.ZodLiteral<(typeof STORY_POINT_OPTIONS)[number]>[],
    ]
  ),
});

export type LinkedTaskInput = z.infer<typeof linkedTaskSchema>;

export const manualEntrySchema = z
  .object({
    actionTypeId: z.string().min(1, "Escolha uma categoria"),
    date: z.string().min(1, "Escolha uma data"),
    startTime: z.string().min(1, "Informe o horário de início"),
    endTime: z.string().min(1, "Informe o horário de término"),
    taskCreated: z.boolean(),
    tasks: z.array(linkedTaskSchema).max(20),
    notes: z.string().max(1000).optional(),
    /** Segundos a descontar do intervalo início–término (tempo pausado do
     * cronômetro). Editável no modal de edição; sempre 0 no lançamento manual. */
    pausedSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
  })
  .refine(
    (data) => `${data.date}T${data.startTime}` < `${data.date}T${data.endTime}`,
    { message: "Horário de término deve ser depois do início", path: ["endTime"] }
  )
  .refine((data) => data.date <= toLocalIsoDate(new Date()), {
    message: "Não é possível lançar um registro em data futura",
    path: ["date"],
  })
  .refine(
    (data) => {
      const spanMs =
        new Date(`${data.date}T${data.endTime}`).getTime() -
        new Date(`${data.date}T${data.startTime}`).getTime();
      return (data.pausedSeconds ?? 0) * 1000 <= spanMs;
    },
    {
      message: "Tempo pausado não pode ser maior que a duração do registro",
      path: ["pausedSeconds"],
    }
  );

export type ManualEntryInput = z.infer<typeof manualEntrySchema>;
