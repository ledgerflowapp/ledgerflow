import * as React from "react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty"

interface EmptyStateProps extends React.ComponentProps<typeof Empty> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

/**
 * EmptyState is a higher-level composition of the atomic Empty components.
 * Use it to quickly scaffold an empty state for a list, table, or page.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Empty className={className} {...props}>
      <EmptyHeader>
        {icon && <EmptyMedia variant="icon">{icon}</EmptyMedia>}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
