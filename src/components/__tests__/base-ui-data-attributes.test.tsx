import { renderToString } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { Attachment, AttachmentMedia, AttachmentTitle, AttachmentDescription } from '@/components/ui/attachment'
import { SidebarProvider, Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuIndicator } from '@/components/ui/navigation-menu'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

describe('Base UI Boolean Data-Attribute Compliance', () => {
  it('TableRow uses data-selected boolean attribute selector', () => {
    const html = renderToString(
      <Table>
        <TableBody>
          <TableRow data-selected>
            <TableCell>Test Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(html).toContain('data-selected:bg-muted')
    expect(html).not.toContain('data-[state=selected]')
  })

  it('Attachment component renders Base UI boolean state attributes', () => {
    const errorHtml = renderToString(
      <Attachment state="error">
        <AttachmentMedia variant="icon" />
        <AttachmentTitle>Error File</AttachmentTitle>
        <AttachmentDescription>Upload failed</AttachmentDescription>
      </Attachment>
    )

    expect(errorHtml).toContain('data-error="true"')
    expect(errorHtml).toContain('data-error:border-destructive/30')
    expect(errorHtml).not.toContain('data-[state=error]')

    const idleHtml = renderToString(
      <Attachment state="idle">
        <AttachmentTitle>Idle File</AttachmentTitle>
      </Attachment>
    )

    expect(idleHtml).toContain('data-idle="true"')
    expect(idleHtml).toContain('data-idle:border-dashed')
    expect(idleHtml).not.toContain('data-[state=idle]')
  })

  it('Sidebar sets data-collapsed boolean attribute when collapsed', () => {
    const html = renderToString(
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon">
          <SidebarRail />
        </Sidebar>
        <SidebarInset>Content</SidebarInset>
      </SidebarProvider>
    )

    expect(html).toContain('data-collapsed="true"')
    expect(html).toContain('peer-data-collapsed:ml-2')
    expect(html).not.toContain('peer-data-[state=collapsed]')
    expect(html).not.toContain('data-[state=collapsed]_&')
  })

  it('NavigationMenuIndicator uses Base UI data-open and data-closed attributes', () => {
    const html = renderToString(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuIndicator />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    expect(html).toContain('data-closed:animate-out')
    expect(html).toContain('data-open:animate-in')
    expect(html).not.toContain('data-[state=hidden]')
    expect(html).not.toContain('data-[state=visible]')
  })

  it('TooltipContent does not contain legacy Radix data-[state=delayed-open]', () => {
    const html = renderToString(
      <TooltipProvider delay={0}>
        <Tooltip open={true}>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    expect(html).not.toContain('data-[state=delayed-open]')
  })

  it('Verifies component source files do not contain legacy data-[state=...] attributes', async () => {
    const fs = await import('fs')
    const path = await import('path')

    const files = [
      'src/components/ui/table.tsx',
      'src/components/ui/tooltip.tsx',
      'src/components/ui/navigation-menu.tsx',
      'src/components/ui/sidebar.tsx',
      'src/components/ui/attachment.tsx',
    ]

    for (const fileRel of files) {
      const fullPath = path.join(process.cwd(), fileRel)
      const content = fs.readFileSync(fullPath, 'utf-8')
      expect(content).not.toContain('data-[state=')
    }
  })

  it('Verifies OnboardingModal uses Base UI disablePointerDismissal={true} and modal={true}', async () => {
    const fs = await import('fs')
    const path = await import('path')

    const fullPath = path.join(process.cwd(), 'src/components/auth/OnboardingModal.tsx')
    const content = fs.readFileSync(fullPath, 'utf-8')

    expect(content).toContain('disablePointerDismissal={true}')
    expect(content).toContain('modal={true}')
    expect(content).not.toContain('onInteractOutside')
  })
})
