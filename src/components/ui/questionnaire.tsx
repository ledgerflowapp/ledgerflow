"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { buttonVariants, type Button } from "@/components/ui/button"
import { CheckIcon } from "@phosphor-icons/react"

interface QuestionnaireContextValue {
  step: number
  setStep: (step: number | ((prev: number) => number)) => void
  totalSteps: number
  setTotalSteps: (total: number) => void
  values: Record<string, any>
  setValue: (key: string, value: any) => void
  registerStep: () => number
}

const QuestionnaireContext = React.createContext<QuestionnaireContextValue | null>(null)

export function useQuestionnaire() {
  const context = React.useContext(QuestionnaireContext)
  if (!context) {
    throw new Error("Questionnaire components must be used within a Questionnaire")
  }
  return context
}

interface QuestionnaireChoicesContextValue {
  value?: any
  onValueChange?: (val: any) => void
  type?: "radio" | "checkbox"
}

const QuestionnaireChoicesContext = React.createContext<QuestionnaireChoicesContextValue | null>(null)

interface QuestionnaireProps extends React.HTMLAttributes<HTMLDivElement> {
  step?: number
  defaultStep?: number
  onStepChange?: (step: number) => void
  totalSteps?: number
  values?: Record<string, any>
  onValuesChange?: (values: Record<string, any>) => void
}

function Questionnaire({
  className,
  step: controlledStep,
  defaultStep = 1,
  onStepChange,
  totalSteps: controlledTotalSteps = 0,
  values: controlledValues,
  onValuesChange,
  children,
  ...props
}: QuestionnaireProps) {
  const [uncontrolledStep, setUncontrolledStep] = React.useState(defaultStep)
  const [totalSteps, setTotalSteps] = React.useState(controlledTotalSteps)
  const [internalValues, setInternalValues] = React.useState<Record<string, any>>({})
  const registeredCountRef = React.useRef(0)

  const isStepControlled = controlledStep !== undefined
  const currentStep = isStepControlled ? controlledStep : uncontrolledStep

  const setStep = React.useCallback(
    (nextStep: number | ((prev: number) => number)) => {
      const computedStep = typeof nextStep === "function" ? nextStep(currentStep) : nextStep
      if (!isStepControlled) {
        setUncontrolledStep(computedStep)
      }
      onStepChange?.(computedStep)
    },
    [currentStep, isStepControlled, onStepChange]
  )

  const registerStep = React.useCallback(() => {
    registeredCountRef.current += 1
    const stepNum = registeredCountRef.current
    setTotalSteps((prev) => Math.max(prev, stepNum))
    return stepNum
  }, [])

  const values = controlledValues ?? internalValues

  const setValue = React.useCallback(
    (key: string, val: any) => {
      const newValues = { ...values, [key]: val }
      if (!controlledValues) {
        setInternalValues(newValues)
      }
      onValuesChange?.(newValues)
    },
    [controlledValues, values, onValuesChange]
  )

  const effectiveTotalSteps = (controlledTotalSteps > 0 ? controlledTotalSteps : null) ?? (totalSteps > 0 ? totalSteps : null) ?? 1

  return (
    <QuestionnaireContext.Provider
      value={{
        step: currentStep,
        setStep,
        totalSteps: effectiveTotalSteps,
        setTotalSteps,
        values,
        setValue,
        registerStep,
      }}
    >
      <div
        data-slot="questionnaire"
        className={cn("flex w-full min-w-0 flex-col gap-6", className)}
        {...props}
      >
        {children}
      </div>
    </QuestionnaireContext.Provider>
  )
}

function QuestionnaireProgress({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { step, totalSteps } = useQuestionnaire()

  return (
    <div
      data-slot="questionnaire-progress"
      className={cn(
        "min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium text-muted-foreground tabular-nums",
        className
      )}
      {...props}
    >
      {children ?? `Step ${step} of ${totalSteps}`}
    </div>
  )
}

interface QuestionnaireItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step?: number
}

function QuestionnaireItem({
  className,
  step,
  children,
  ...props
}: QuestionnaireItemProps) {
  const { step: currentStep, registerStep } = useQuestionnaire()
  const itemStepRef = React.useRef<number | null>(null)

  if (itemStepRef.current === null && step === undefined) {
    itemStepRef.current = registerStep()
  }

  const assignedStep = step ?? itemStepRef.current ?? 1
  const isActive = currentStep === assignedStep

  if (!isActive) return null

  return (
    <div
      data-slot="questionnaire-item"
      data-step={assignedStep}
      className={cn(
        "flex min-w-0 flex-col gap-5 border-0 p-0 outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function QuestionnaireTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="questionnaire-title"
      className={cn(
        "font-heading text-base font-semibold text-pretty [&:not(:has(~[data-slot=questionnaire-description]))]:mb-5",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="questionnaire-description"
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  )
}

interface QuestionnaireChoicesProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: any
  onValueChange?: (val: any) => void
  type?: "radio" | "checkbox"
}

function QuestionnaireChoices({
  className,
  value,
  onValueChange,
  type = "radio",
  children,
  ...props
}: QuestionnaireChoicesProps) {
  return (
    <QuestionnaireChoicesContext.Provider value={{ value, onValueChange, type }}>
      <div
        data-slot="questionnaire-choices"
        className={cn(
          "group/questionnaire-choices grid min-w-0 gap-3",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </QuestionnaireChoicesContext.Provider>
  )
}

interface QuestionnaireChoiceProps extends React.HTMLAttributes<HTMLLabelElement> {
  value?: string
  checked?: boolean
  disabled?: boolean
  shortcut?: string
}

function QuestionnaireChoice({
  children,
  className,
  value,
  checked: controlledChecked,
  disabled,
  shortcut,
  onClick,
  ...props
}: QuestionnaireChoiceProps) {
  const choicesCtx = React.useContext(QuestionnaireChoicesContext)
  const isChecked = controlledChecked ?? (choicesCtx?.value !== undefined && choicesCtx.value === value)

  const handleClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (disabled) return
    if (choicesCtx?.onValueChange && value !== undefined) {
      choicesCtx.onValueChange(value)
    }
    onClick?.(e)
  }

  return (
    <label
      data-slot="questionnaire-choice"
      data-checked={isChecked ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-type={choicesCtx?.type ?? "radio"}
      data-shortcut={shortcut ? "" : undefined}
      className={cn(
        "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-3 rounded-3xl border border-input bg-input/20 px-4 py-3 text-start text-sm transition-colors outline-none select-none hover:bg-input/40 has-[>input:focus-visible]:border-ring has-[>input:focus-visible]:ring-3 has-[>input:focus-visible]:ring-ring/50 data-invalid:border-destructive data-checked:border-primary/40 data-checked:bg-primary/10",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <input
        type={choicesCtx?.type ?? "radio"}
        checked={isChecked}
        onChange={() => {}}
        disabled={disabled}
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="pointer-events-none relative flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-transparent bg-input/90 group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground dark:group-data-checked/questionnaire-choice:bg-primary"
      >
        <span
          data-slot="questionnaire-choice-indicator-dot"
          className="hidden size-2 rounded-full bg-primary-foreground group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block dark:size-2.5"
        />
        <CheckIcon data-slot="questionnaire-choice-indicator-check" className="hidden size-3.5 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block" />
      </span>
      <span
        data-slot="questionnaire-choice-label"
        className="flex min-w-0 flex-1 flex-col gap-1 leading-snug"
      >
        {children}
      </span>
      {shortcut && (
        <span
          data-slot="questionnaire-choice-shortcut"
          className="pointer-events-none ms-auto mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-background/80 font-mono text-[0.625rem] leading-none font-medium text-muted-foreground"
        >
          {shortcut}
        </span>
      )}
    </label>
  )
}

function QuestionnaireInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      data-slot="questionnaire-input-wrapper"
      className="group/questionnaire-input relative w-full min-w-0"
    >
      <input
        data-slot="questionnaire-input"
        className={cn(
          "h-9 min-h-11 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:min-h-0 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
}

function QuestionnaireError({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="questionnaire-error"
      className={cn("text-sm text-destructive", className)}
      {...props}
    />
  )
}

function QuestionnaireActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-9",
        className
      )}
      {...props}
    />
  )
}

interface QuestionnaireButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Pick<React.ComponentProps<typeof Button>, "size" | "variant"> {}

function QuestionnairePrevious({
  children,
  className,
  size = "default",
  variant = "outline",
  onClick,
  disabled,
  ...props
}: QuestionnaireButtonProps) {
  const { step, setStep } = useQuestionnaire()
  const isFirstStep = step <= 1

  return (
    <button
      type="button"
      data-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      disabled={disabled ?? isFirstStep}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented && !isFirstStep) {
          setStep((s) => s - 1)
        }
      }}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Previous"}
    </button>
  )
}

function QuestionnaireSkip({
  children,
  className,
  size = "default",
  variant = "outline",
  onClick,
  ...props
}: QuestionnaireButtonProps) {
  const { setStep, totalSteps, step } = useQuestionnaire()

  return (
    <button
      type="button"
      data-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented && step < totalSteps) {
          setStep((s) => s + 1)
        }
      }}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Skip"}
    </button>
  )
}

function QuestionnaireNext({
  children,
  className,
  size = "default",
  variant = "default",
  onClick,
  disabled,
  ...props
}: QuestionnaireButtonProps) {
  const { step, totalSteps, setStep } = useQuestionnaire()
  const isLastStep = step >= totalSteps

  return (
    <button
      type="button"
      data-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      disabled={disabled ?? isLastStep}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented && !isLastStep) {
          setStep((s) => s + 1)
        }
      }}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Next"}
    </button>
  )
}

function QuestionnaireSubmit({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: QuestionnaireButtonProps) {
  return (
    <button
      type="submit"
      data-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Submit"}
    </button>
  )
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
}
