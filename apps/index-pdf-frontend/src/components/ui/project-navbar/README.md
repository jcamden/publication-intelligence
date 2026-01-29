# Project Navbar Component

The main navigation bar for the IndexPDF application, providing access to core features and user account management.

## Features

- **Branded Logo**: Gradient logo that links to home
- **Navigation Links**: Quick access to Editor, Index, and Projects
- **Active State**: Visual indication of current page
- **User Menu**: Integrated user dropdown with settings and sign out
- **Responsive**: Adapts to different screen sizes
- **Sticky Header**: Stays at top of viewport with backdrop blur
- **Theme-aware**: Seamlessly adapts to light and dark themes

## Usage

```tsx
import { ProjectNavbar } from "@/components/ui/project-navbar";

export default function Layout({ children }) {
  return (
    <>
      <ProjectNavbar 
        userName="John Doe"
        userEmail="john@example.com"
      />
      <main>{children}</main>
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userName` | `string` | `undefined` | User's display name for the dropdown |
| `userEmail` | `string` | `undefined` | User's email address |
| `className` | `string` | `undefined` | Additional CSS classes for the nav element |

## Navigation Structure

The navbar includes three main navigation items:

1. **Editor** (`/projects/editor`) - Document editing interface
2. **Index** (`/projects/index`) - Search and browse indexed content
3. **Projects** (`/projects`) - Project management and overview

## Examples

### Basic Implementation

```tsx
<ProjectNavbar />
```

### With User Information

```tsx
<ProjectNavbar 
  userName="Jane Smith"
  userEmail="jane@example.com"
/>
```

### With Authentication Hook

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { ProjectNavbar } from "@/components/ui/project-navbar";

export const AppLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <>
      <ProjectNavbar 
        userName={user?.name}
        userEmail={user?.email}
      />
      {children}
    </>
  );
};
```

## Architecture

The component:
- Uses **Next.js App Router** for navigation (`next/link`, `usePathname`)
- Integrates **yaboujee components** (Logo, UserDropdown)
- Manages active state based on current pathname
- Handles navigation and authentication callbacks
- Applies consistent styling with Tailwind CSS

## Active State Detection

The navbar automatically detects and highlights the current page:

```tsx
const pathname = usePathname();
const isActive = pathname === item.href;
```

Active links receive:
- Background color (`bg-muted`)
- Foreground color (`text-foreground`)
- Visual distinction from inactive links

## User Actions

### Settings Click
Navigates to `/settings` page where users can manage their account preferences.

### Sign Out Click
Navigates to `/api/auth/signout` to handle authentication logout flow.

## Styling

The navbar features:
- **Sticky positioning** at the top of the viewport
- **Backdrop blur** for modern glass-morphism effect
- **Border bottom** for visual separation
- **Max-width container** (7xl) for consistent content width
- **Responsive padding** that adapts to screen size

## Customization

### Custom Navigation Items

To add or modify navigation items, edit the `navItems` array:

```tsx
const navItems = [
  { label: "Editor", href: "/projects/editor" },
  { label: "Index", href: "/projects/index" },
  { label: "Projects", href: "/projects" },
  { label: "Analytics", href: "/analytics" }, // Add new item
];
```

### Custom Styling

```tsx
<ProjectNavbar 
  className="shadow-lg border-b-2"
  userName="User"
/>
```

## Dependencies

- **yaboujee**: Logo and UserDropdown components
- **next/link**: Client-side navigation
- **next/navigation**: usePathname and useRouter hooks
- **Tailwind CSS**: Styling utilities

## Integration Notes

This component is designed specifically for the IndexPDF frontend application and uses:
- Next.js 15+ App Router conventions
- yaboujee component library
- Tailwind CSS v4 utilities
- Project-specific routing structure
