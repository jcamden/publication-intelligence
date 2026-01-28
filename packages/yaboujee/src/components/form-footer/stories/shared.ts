import type { FormFooterProps } from "../form-footer";

export const longTextVariant: Pick<
	FormFooterProps,
	"text" | "linkText" | "linkHref"
> = {
	text: "Don't have an account? What about really long text that wraps? Is that working?",
	linkText: "Sign up",
	linkHref: "/signup",
};
