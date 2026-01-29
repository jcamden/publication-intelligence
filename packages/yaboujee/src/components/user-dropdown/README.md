# User Dropdown Component

A composable user menu dropdown component that displays user information and provides access to settings and sign out actions.

## Features

- **User Information Display**: Shows user name and optional email
- **Settings Access**: Direct link to user settings
- **Sign Out Action**: Quick access to sign out functionality
- **Theme Support**: Works seamlessly in light and dark modes
- **Icon-based Trigger**: Uses Lucide React icons for consistent UI
- **Accessible**: Built with proper ARIA attributes via Base UI

## Usage

```tsx
import { UserDropdown } from "@pubint/yaboujee";

export const MyNavbar = () => {
  const handleSettings = () => {
    router.push("/settings");
  };

  const handleSignOut = () => {
    router.push("/api/auth/signout");
  };

  return (
    <nav>
      <UserDropdown
        userName="John Doe"
        userEmail="john.doe@example.com"
        onSettingsClick={handleSettings}
        onSignOutClick={handleSignOut}
      />
    </nav>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userName` | `string` | `"User"` | The user's display name |
| `userEmail` | `string` | `undefined` | Optional email address to display |
| `onSettingsClick` | `() => void` | `undefined` | Callback when settings menu item is clicked |
| `onSignOutClick` | `() => void` | `undefined` | Callback when sign out menu item is clicked |
| `className` | `string` | `undefined` | Additional CSS classes for the trigger button |

## Examples

### Basic Usage

```tsx
<UserDropdown
  userName="Jane Smith"
  onSettingsClick={() => console.log("Settings")}
  onSignOutClick={() => console.log("Sign out")}
/>
```

### With Email

```tsx
<UserDropdown
  userName="John Doe"
  userEmail="john.doe@example.com"
  onSettingsClick={handleSettings}
  onSignOutClick={handleSignOut}
/>
```

### With Next.js Router

```tsx
"use client";

import { useRouter } from "next/navigation";
import { UserDropdown } from "@pubint/yaboujee";

export const AppNavbar = () => {
  const router = useRouter();

  return (
    <UserDropdown
      userName="Current User"
      userEmail="user@example.com"
      onSettingsClick={() => router.push("/settings")}
      onSignOutClick={() => router.push("/api/auth/signout")}
    />
  );
};
```

## Architecture

The component uses:
- **Base UI Menu**: For accessible dropdown functionality
- **Yabasic Components**: Button and DropdownMenu primitives
- **Lucide React**: For consistent iconography
- **Tailwind CSS**: For styling and theming

## Storybook

View the component in Storybook:

```bash
cd packages/yaboujee
pnpm storybook
```

The component includes:
- Main stories with different configurations
- Interaction tests for dropdown behavior
- Visual regression tests (light/dark themes)

## Accessibility

- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader friendly with ARIA attributes
- Focus management handled by Base UI
- Visual focus indicators

## Integration Tips

### With Authentication Context

```tsx
const { user, signOut } = useAuth();

<UserDropdown
  userName={user.name}
  userEmail={user.email}
  onSettingsClick={() => router.push("/settings")}
  onSignOutClick={signOut}
/>
```

### In a Navbar Component

```tsx
<nav className="flex items-center justify-between p-4">
  <Logo variant="gradient" size="sm" />
  <div className="flex items-center gap-4">
    <NavLinks />
    <UserDropdown {...userProps} />
  </div>
</nav>
```
