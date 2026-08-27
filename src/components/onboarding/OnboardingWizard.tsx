"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Questionnaire,
    QuestionnaireProgress,
    QuestionnaireItem,
    QuestionnaireTitle,
    QuestionnaireDescription,
    QuestionnaireChoices,
    QuestionnaireChoice,
    QuestionnaireInput,
    QuestionnaireActions,
    QuestionnairePrevious,
    QuestionnaireNext,
    QuestionnaireSubmit,
} from "@/components/ui/questionnaire"
import { useAppStore } from "@/store/useAppStore"
import { toast } from "@/components/ui/toast"
import { completeOnboarding, updateOnboardingStep } from "@/lib/actions/onboarding"

export interface OnboardingWizardProps {
    defaultStep?: number
    defaultUsername?: string
    defaultMode?: "personal" | "business"
    defaultAccent?: string
    defaultCurrency?: string
    className?: string
    onComplete?: () => void
}

export function OnboardingWizard({
    defaultStep = 1,
    defaultUsername = "",
    defaultMode = "personal",
    defaultAccent = "emerald",
    defaultCurrency = "₹",
    className,
    onComplete,
}: OnboardingWizardProps) {
    const router = useRouter()
    const [step, setStep] = React.useState(defaultStep)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Form state
    const [username, setUsername] = React.useState(defaultUsername)
    const [mode, setMode] = React.useState<"personal" | "business">(defaultMode)
    const [accent, setAccent] = React.useState(defaultAccent)
    const [currency, setCurrency] = React.useState(defaultCurrency)

    const setAppMode = useAppStore((state) => state.setMode)
    const updateThemeSettings = useAppStore((state) => state.updateThemeSettings)

    // Sync step to DB when it changes
    React.useEffect(() => {
        if (step > 1 && step <= 4) {
            updateOnboardingStep(step).catch(console.error)
        }
    }, [step])

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        
        if (!username.trim() || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            toast.error("Please enter a valid username (min 3 chars, letters/numbers/underscores only)")
            setStep(1)
            return
        }

        setIsSubmitting(true)
        try {
            await completeOnboarding({ username, mode, accent, currency })

            // Apply to local state
            setAppMode(mode)
            updateThemeSettings(mode, {
                theme: mode === "business" ? "light" : "dark",
                accent,
            })
            
            toast.success("Onboarding preferences saved successfully!")
            
            if (onComplete) {
                onComplete()
            } else {
                router.push("/dashboard")
                router.refresh()
            }
        } catch (error: any) {
            if (error?.message?.includes("unique constraint") || error?.code === "23505") {
                toast.error("This username is already taken. Please choose another.")
                setStep(1)
            } else {
                toast.error("Failed to complete onboarding. Please try again.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Questionnaire
            step={step}
            onStepChange={setStep}
            totalSteps={4}
            className={className}
        >
            <div className="flex items-center justify-between mb-2">
                <QuestionnaireProgress className="tabular-nums font-medium text-xs text-muted-foreground">
                    Step {step} of 4
                </QuestionnaireProgress>
            </div>

            {/* Step 1: Username */}
            <QuestionnaireItem step={1}>
                <QuestionnaireTitle>Choose a Username</QuestionnaireTitle>
                <QuestionnaireDescription>
                    Set a unique username to make it easier for others to find you on LedgerFlow.
                </QuestionnaireDescription>
                <QuestionnaireInput 
                    placeholder="Enter username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                />
            </QuestionnaireItem>

            {/* Step 2: Workspace Mode */}
            <QuestionnaireItem step={2}>
                <QuestionnaireTitle>Select Workspace Mode</QuestionnaireTitle>
                <QuestionnaireDescription>
                    Choose your primary financial workflow. You can toggle between Personal and Business modes at any time.
                </QuestionnaireDescription>
                <QuestionnaireChoices
                    value={mode}
                    onValueChange={(val) => setMode(val as "personal" | "business")}
                >
                    <QuestionnaireChoice value="personal">
                        <span className="font-medium">Personal Mode</span>
                        <span className="text-xs text-muted-foreground">
                            Track individual expenses, budget categories, and shared group balances
                        </span>
                    </QuestionnaireChoice>
                    <QuestionnaireChoice value="business">
                        <span className="font-medium">Business Mode</span>
                        <span className="text-xs text-muted-foreground">
                            Manage customer & supplier ledgers, business cash flow, and debt statements
                        </span>
                    </QuestionnaireChoice>
                </QuestionnaireChoices>
            </QuestionnaireItem>

            {/* Step 3: Accent Theme */}
            <QuestionnaireItem step={3}>
                <QuestionnaireTitle>Workspace Accent Theme</QuestionnaireTitle>
                <QuestionnaireDescription>
                    Select default accent palette boundaries for your active workspace interface.
                </QuestionnaireDescription>
                <QuestionnaireChoices
                    value={accent}
                    onValueChange={(val) => setAccent(val)}
                >
                    <QuestionnaireChoice value="emerald">
                        <span className="font-medium">Emerald</span>
                        <span className="text-xs text-muted-foreground">
                            Clean green primary accents
                        </span>
                    </QuestionnaireChoice>
                    <QuestionnaireChoice value="blue">
                        <span className="font-medium">Blue</span>
                        <span className="text-xs text-muted-foreground">
                            Professional corporate blue accents
                        </span>
                    </QuestionnaireChoice>
                    <QuestionnaireChoice value="purple">
                        <span className="font-medium">Purple</span>
                        <span className="text-xs text-muted-foreground">
                            Modern vibrant violet accents
                        </span>
                    </QuestionnaireChoice>
                    <QuestionnaireChoice value="amber">
                        <span className="font-medium">Amber</span>
                        <span className="text-xs text-muted-foreground">
                            Warm high-contrast amber accents
                        </span>
                    </QuestionnaireChoice>
                </QuestionnaireChoices>
            </QuestionnaireItem>

            {/* Step 4: Primary Currency */}
            <QuestionnaireItem step={4}>
                <QuestionnaireTitle>Default Currency</QuestionnaireTitle>
                <QuestionnaireDescription>
                    Select the primary currency symbol for your financial amounts and transaction reports.
                </QuestionnaireDescription>
                <QuestionnaireChoices
                    value={currency}
                    onValueChange={(val) => setCurrency(val)}
                >
                    <QuestionnaireChoice value="₹">
                        <span className="font-medium">INR (₹) — Indian Rupee</span>
                    </QuestionnaireChoice>
                    <QuestionnaireChoice value="$">
                        <span className="font-medium">USD ($) — US Dollar</span>
                    </QuestionnaireChoice>
                    <QuestionnaireChoice value="€">
                        <span className="font-medium">EUR (€) — Euro</span>
                    </QuestionnaireChoice>
                    <QuestionnaireChoice value="£">
                        <span className="font-medium">GBP (£) — British Pound</span>
                    </QuestionnaireChoice>
                </QuestionnaireChoices>
            </QuestionnaireItem>

            {/* Questionnaire Actions */}
            <QuestionnaireActions>
                {step > 1 && <QuestionnairePrevious disabled={isSubmitting}>Previous</QuestionnairePrevious>}
                {step < 4 ? (
                    <QuestionnaireNext disabled={step === 1 && (!username || username.length < 3)}>Next</QuestionnaireNext>
                ) : (
                    <QuestionnaireSubmit onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Complete Setup"}
                    </QuestionnaireSubmit>
                )}
            </QuestionnaireActions>
        </Questionnaire>
    )
}
