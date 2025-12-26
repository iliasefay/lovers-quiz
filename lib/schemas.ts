import { z } from "zod";

// Participant schema
export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(20),
  joinedAt: z.number(),
});

// Lobby code validation
export const LobbyCodeSchema = z
  .string()
  .length(5)
  .regex(/^[0-9]{5}$/, "Code must be exactly 5 digits");

// Socket event payload schemas
export const CreateLobbySchema = z.object({
  hostName: z.string().min(1).max(20).trim(),
});

export const JoinLobbySchema = z.object({
  code: LobbyCodeSchema,
  playerName: z.string().min(1).max(20).trim(),
});

export const SelectPackSchema = z.object({
  packId: z.string().min(1),
});

export const HostAnswerSchema = z.object({
  index: z.number().min(0).max(9),
  questionId: z.string().min(1),
  value: z.string().max(200),
});

export const PlayerDraftSchema = z.object({
  index: z.number().min(0).max(9),
  text: z.string().max(200),
});

export const PlayerAnswerSchema = z.object({
  index: z.number().min(0).max(9),
  value: z.string().max(200),
});

export const JudgeSchema = z.object({
  index: z.number().min(0).max(9),
  isCorrect: z.boolean(),
});

export const ReconnectSchema = z.object({
  code: LobbyCodeSchema,
  role: z.enum(["host", "player"]),
  token: z.string().optional(),
});

// Question schema
export const QuestionTypeSchema = z.enum([
  "TEXT",
  "MULTI_CHOICE",
  "THIS_OR_THAT",
  "SCALE",
]);

export const QuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeSchema,
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  helper: z.string().optional(),
  maxLen: z.number().optional(),
});

// Validation helpers
export function validatePayload<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Zod 4 uses .issues instead of .errors
  const issues = result.error.issues || [];
  return { success: false, error: issues[0]?.message || "Invalid data" };
}
