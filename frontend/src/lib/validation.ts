import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(100),
});

export const customerSignupSchema = z.object({
  name: z.string().trim().min(2, "Required").max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone"),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(100),
});

export const workerSignupSchema = z.object({
  name: z.string().trim().min(2, "Required").max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone"),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(100),
  dob: z.string().min(1, "Required"),
  experience: z.coerce.number().min(0).max(60),
  skills: z.array(z.string()).min(1, "Pick at least one skill"),
  languages: z.array(z.string()).min(1, "Pick at least one language"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type WorkerSignupInput = z.infer<typeof workerSignupSchema>;
