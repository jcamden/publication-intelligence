import type { Meta, StoryObj } from "@storybook/react";
import { LandingNavbar } from "../landing-navbar";
import { NavbarWithContent } from "./shared";

const codeBlock = `import { LandingNavbar } from "@pubint/yaboujee";
import { useState } from "react";

const MyNavbar = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  return (
    <LandingNavbar
      theme={theme}
      onThemeToggle={() => setTheme(theme === "light" ? "dark" : "light")}
    />
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the LandingNavbar component as the primary navigation for landing and marketing pages.

## Features
- **Logo**: Clickable logo that links to homepage
- **Theme Toggle**: Built-in light/dark mode toggle
- **Auth Links**: Optional login and signup links
- **Fixed Position**: Stays at the top with backdrop blur effect

## Props
- **theme**: Current theme ("light" or "dark")
- **onThemeToggle**: Callback for theme changes
- **showAuthLinks**: Optional, shows/hides authentication links (default: true)

## Accessibility
The navbar uses semantic HTML with proper focus management and keyboard navigation support.`;

export default {
	component: LandingNavbar,
	title: "Components/LandingNavbar",
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component: `The LandingNavbar component provides a fixed navigation bar for landing pages with logo, auth links, and theme toggle.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
	},
	argTypes: {
		theme: {
			control: {
				type: "select",
			},
			options: ["light", "dark"],
			description: "Current theme mode",
		},
		showAuthLinks: {
			control: {
				type: "boolean",
			},
			description: "Show or hide authentication links",
		},
	},
} satisfies Meta<typeof LandingNavbar>;

export const Default: StoryObj<typeof LandingNavbar> = {
	render: () => <NavbarWithContent />,
};

export const WithoutAuthLinks: StoryObj<typeof LandingNavbar> = {
	render: () => <NavbarWithContent showAuthLinks={false} />,
};
