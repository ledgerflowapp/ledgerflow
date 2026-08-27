## Agent skills

### Issue tracker

Issues and specs live as GitHub issues. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context documentation layout (`CONTEXT.md` and `docs/adr/`). See `docs/agents/domain.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Base UI & shadcn/ui v4 Guidelines

> [!WARNING]
> **CRITICAL**: Do not add/suggest `@radix-ui/react-*` imports in `src/` (migrated to `@base-ui/react`). Exceptions strictly limited to `docs/radix-migration-audit.md` (e.g., vaul's dialog, label/slot in `form.tsx`).

### Stack & CLI
- **Stack**: shadcn/ui v4 (`^4.8.0`) + `@base-ui/react` (`^1.5.0`). Style is set to `base-luma` in `components.json` (do not change).
- **CLI**: `pnpm dlx shadcn@latest add <component>` (do not use legacy `shadcn-ui` commands).

### Key API & Import Patterns
- **Imports**: Use `@base-ui/react/<component>` (e.g., `import { Dialog } from "@base-ui/react/dialog"`). No `@radix-ui/react-*` or `<Primitive.Root>`.
- **Composition**: Use `render` prop instead of `asChild` (e.g., `<Dialog.Trigger render={<Button />}>Open</Dialog.Trigger>`). Custom elements must forward ref and spread props.
- **Data Attributes**: Use boolean attributes (`data-open`, `data-closed`, `data-checked`, `data-unchecked`). Tailwind: `data-open:opacity-100` (not `data-[state=open]:`).
- **Events**: Radix events (`onInteractOutside`, `onEscapeKeyDown`) do not exist. Use `onOpenChange(open, eventDetails)` with `eventDetails.reason` (`'escape-key'`, `'outside-press'`), or `dismissible={false}` / `modal={true}`.
- **Drawer**: Use shadcn wrapper `@/components/ui/drawer`, not raw `vaul` or Radix `Sheet`.

### Reference Links
- [shadcn/ui v4 Docs](https://ui.shadcn.com/docs)
- [Base UI React Components](https://base-ui.com/react/components/)
