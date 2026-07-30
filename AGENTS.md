# AI Agent Context: Base UI & shadcn/ui v4 Guidelines

> [!WARNING]
> **CRITICAL RULE**: Do not add, restore, or suggest `@radix-ui/react-*` individual packages as imports in `src/` files. The project has fully migrated to `@base-ui/react`. The only exception is packages explicitly listed in the "Intentionally Kept" section of `docs/radix-migration-audit.md` (e.g., `@radix-ui/react-dialog` via `vaul`, and label/slot in `form.tsx`).

## Stack Declaration
This project uses **shadcn/ui v4** with **Base UI primitives (`@base-ui/react`)**, NOT Radix UI.
- `@base-ui/react`: `^1.5.0`
- `shadcn`: `^4.8.0`

## Import Patterns
Always use Base UI for component primitives.

**❌ OLD/WRONG Pattern (Radix):**
```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Root as DialogRoot } from "@radix-ui/react-dialog"
```

**✅ NEW/CORRECT Pattern (Base UI):**
```tsx
import { Dialog } from "@base-ui/react/dialog"
import { AlertDialog } from "@base-ui/react/alert-dialog"
```

## Key API Differences Agents Commonly Get Wrong

### 1. The `asChild` Pattern vs Base UI's `render` Prop
Base UI **does not** use the `asChild` composition pattern. Instead, it uses the `render` prop.
**❌ Wrong (Radix):** `<DialogTrigger asChild><Button>Open</Button></DialogTrigger>`
**✅ Correct (Base UI):** `<Dialog.Trigger render={<Button />}>Open</Dialog.Trigger>`
*Note: The custom component passed to `render` must forward its ref and spread all received props.*

### 2. Interaction Events (`onInteractOutside`, etc.)
Radix-specific events like `onInteractOutside`, `onEscapeKeyDown`, and `onPointerDownOutside` **do not exist** on Base UI components like `Popup`.
**✅ Correct (Base UI):** Use `onOpenChange(open, eventDetails)` where `eventDetails.reason` provides the event context (e.g., `'escape-key'`, `'outside-press'`), or use `dismissible={false}` / `modal={true}` to prevent backdrop dismissal natively.

### 3. Data Attributes for State
Base UI uses simpler boolean data attributes instead of Radix's verbose `data-state` pattern.
**❌ Wrong (Radix):** `data-state="open"`, `data-state="closed"`, `data-state="checked"`
**✅ Correct (Base UI):** `data-open`, `data-closed`, `data-checked`, `data-unchecked`
*When styling with Tailwind, use `data-open:opacity-100` instead of `data-[state=open]:opacity-100`.*

### 4. Drawer API
While Drawer relies on `vaul` under the hood, we use the specific shadcn/ui Drawer wrapper.
**Do not** use raw `vaul` or Radix `Sheet` patterns for drawers. Use the project's shadcn component:

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

// Usage:
<Drawer>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Title</DrawerTitle>
      <DrawerDescription>Description</DrawerDescription>
    </DrawerHeader>
    {/* Content */}
  </DrawerContent>
</Drawer>
```

## shadcn/ui CLI Instructions
When adding new shadcn components, the correct command is:
```bash
pnpm dlx shadcn@latest add <component>
```
- **Do not** suggest the old `shadcn-ui` package or v3-style CLI commands.
- Our `components.json` style is configured as `"style": "base-luma"`. **Do not overwrite or change this configuration.**

## What NOT to do (Anti-patterns)
- **Do not** `import * as DialogPrimitive from "@radix-ui/react-dialog"`
- **Do not** install `@radix-ui/react-*` packages.
- **Do not** use `<Primitive.Root>` from radix.
- **Do not** reference `data-[state=open]` in new Tailwind class strings; use `data-open:` instead.
- **Do not** suggest `vaul` Drawer as a replacement for the shadcn Drawer component (the project uses shadcn's Base UI-backed Drawer).

## Reference Links
When uncertain about APIs or component structures, fetch these canonical docs:
- [shadcn/ui v4 Docs](https://ui.shadcn.com/docs)
- [Base UI React Components](https://base-ui.com/react/components/)
- [`docs/radix-to-base-ui-api-diff.md`](./docs/radix-to-base-ui-api-diff.md) (Local, project-specific API diff)

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context documentation layout (`CONTEXT.md` and `docs/adr/`). See `docs/agents/domain.md`.

