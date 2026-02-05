import { emailValidator, passwordValidator } from "@pubint/core";
import { z } from "zod";

// ============================================================================
// Auth DTOs
// ============================================================================

export const SignUpSchema = z.object({
	email: emailValidator,
	password: passwordValidator,
	name: z.string().optional(),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
	email: emailValidator,
	password: passwordValidator,
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
