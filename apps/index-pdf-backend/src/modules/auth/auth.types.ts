import { z } from "zod";

// ============================================================================
// Auth DTOs
// ============================================================================

export const SignUpSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().optional(),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export type SignInInput = z.infer<typeof SignInSchema>;

// ============================================================================
// Token Verification Types
// ============================================================================

export type VerifyTokenResult = {
	valid: boolean;
	identity?: {
		id: string;
	};
	user?: {
		id: string;
		email: string;
		name: string | null;
	};
};
