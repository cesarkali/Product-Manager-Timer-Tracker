import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const actionTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120, "Nome muito longo"),
});

export type ActionTypeInput = z.infer<typeof actionTypeSchema>;

export const manualEntrySchema = z
  .object({
    actionTypeId: z.string().min(1, "Escolha uma categoria"),
    date: z.string().min(1, "Escolha uma data"),
    startTime: z.string().min(1, "Informe o horário de início"),
    endTime: z.string().min(1, "Informe o horário de término"),
    taskCreated: z.boolean(),
    movideskLink: z.string().max(300).optional(),
    jiraLink: z.string().max(300).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => `${data.date}T${data.startTime}` < `${data.date}T${data.endTime}`,
    { message: "Horário de término deve ser depois do início", path: ["endTime"] }
  );

export type ManualEntryInput = z.infer<typeof manualEntrySchema>;
