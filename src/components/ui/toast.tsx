"use client"

import * as React from "react"
import {
  Toast as ToastPrimitive,
  type ToastManagerAddOptions,
  type ToastManagerUpdateOptions,
  type ToastManagerPromiseOptions,
} from "@base-ui/react/toast"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon, CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, SpinnerIcon } from "@phosphor-icons/react"

const rawToastManager = ToastPrimitive.createToastManager()

export type ToastOptions = Omit<ToastManagerAddOptions<any>, "type">

export type ToastInput =
  | React.ReactNode
  | ToastManagerAddOptions<any>

function parseToastInput(
  input: ToastInput,
  options?: ToastOptions,
  type?: string
): ToastManagerAddOptions<any> {
  if (
    typeof input === "object" &&
    input !== null &&
    !React.isValidElement(input) &&
    !Array.isArray(input)
  ) {
    const opts = input as ToastManagerAddOptions<any>
    return {
      ...opts,
      ...(type ? { type } : {}),
    }
  }

  return {
    title: input,
    ...options,
    ...(type ? { type } : {}),
  }
}

export interface ToastHelper {
  (input: ToastInput, options?: ToastOptions): string
  add: (options: ToastManagerAddOptions<any>) => string
  close: (id?: string) => void
  dismiss: (id?: string) => void
  update: (id: string, updates: ToastManagerUpdateOptions<any>) => void
  promise: <Value>(
    promiseValue: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, any>
  ) => Promise<Value>
  success: (input: ToastInput, options?: ToastOptions) => string
  error: (input: ToastInput, options?: ToastOptions) => string
  info: (input: ToastInput, options?: ToastOptions) => string
  warning: (input: ToastInput, options?: ToastOptions) => string
  loading: (input: ToastInput, options?: ToastOptions) => string
}

const toastFn = function (input: ToastInput, options?: ToastOptions) {
  return rawToastManager.add(parseToastInput(input, options))
} as ToastHelper

toastFn.add = (options) => rawToastManager.add(options)
toastFn.close = (id) => rawToastManager.close(id)
toastFn.dismiss = (id) => rawToastManager.close(id)
toastFn.update = (id, updates) => rawToastManager.update(id, updates)
toastFn.promise = (promiseValue, options) =>
  rawToastManager.promise(promiseValue, options)

toastFn.success = (input, options) =>
  rawToastManager.add(parseToastInput(input, options, "success"))
toastFn.error = (input, options) =>
  rawToastManager.add(parseToastInput(input, options, "error"))
toastFn.info = (input, options) =>
  rawToastManager.add(parseToastInput(input, options, "info"))
toastFn.warning = (input, options) =>
  rawToastManager.add(parseToastInput(input, options, "warning"))
toastFn.loading = (input, options) =>
  rawToastManager.add(parseToastInput(input, options, "loading"))

const toast = toastFn

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-[100] mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        className
      )}
      {...props}
    />
  )
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:[transform:translateY(150%)]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className
      )}
      {...props}
    />
  )
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        className
      )}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ToastPrimitive.Close>
  )
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null

  if (type === "success") {
    icon = <CheckCircleIcon className="text-emerald-500" aria-hidden="true" />
  }

  if (type === "info") {
    icon = <InfoIcon className="text-blue-500" aria-hidden="true" />
  }

  if (type === "warning") {
    icon = <WarningIcon className="text-amber-500" aria-hidden="true" />
  }

  if (type === "error") {
    icon = <XCircleIcon className="text-destructive" aria-hidden="true" />
  }

  if (type === "loading") {
    icon = <SpinnerIcon className="animate-spin text-muted-foreground" aria-hidden="true" />
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5"
    >
      {icon}
    </span>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = rawToastManager,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}

