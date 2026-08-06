"use client"

import * as React from "react"
import {
    Questionnaire,
    QuestionnaireProgress,
    QuestionnaireItem,
    QuestionnaireTitle,
    QuestionnaireDescription,
    QuestionnaireChoices,
    QuestionnaireChoice,
    QuestionnaireActions,
    QuestionnairePrevious,
    QuestionnaireNext,
    QuestionnaireSubmit,
} from "@/components/ui/questionnaire"
import { useAppStore } from "@/store/useAppStore"
import { toast } from "@/components/ui/toast"

export interface OnboardingWizardProps {
    onComplete?: (data: {
        mode: "personal" | "business"
        accent: string
        currency: string
    }) => void
    defaultMode?: "personal" | "business"
    defaultAccent?: string
    defaultCurrency?: string
    className?: string
}

export function OnboardingWizard({
    onComplete,
    defaultMode = "personal",
    defaultAccent = "emerald",
    defaultCurrency = "₹",
    className,
}: OnboardingWizardProps) {
    const [step, setStep] = React.useState(1)
    const [mode, setMode] = React.useState<"personal" | "business">(defaultMode)
    const [accent, setAccent] = React.useState(defaultAccent)
    const [currency, setCurrency] = React.useState(defaultCurrency)

    const setAppMode = useAppStore((state) => state.setMode)
    const updateThemeSettings = useAppStore((state) => state.updateThemeSettings)

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        setAppMode(mode)
        updateThemeSettings(mode, {
            theme: mode === "business" ? "light" : "dark",
            accent,
        })
        toast.success("Onboarding preferences saved successfully!")
        onComplete?.({ mode, accent, currency })
    }

    return (
        <Questionnaire
            step={step}
            onStepChange={setStep}
            totalSteps={3}
            className={className}
        >
            <div className="flex items-center justify-between">
                <QuestionnaireProgress className="tabular-nums font-medium text-xs text-muted-foreground">
                    Step {step} of 3
                </QuestionnaireProgress>
            </div>

            {/* Step 1: Workspace Mode */}
            <QuestionnaireItem step={1}>
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

            {/* Step 2: Accent Theme */}
            <QuestionnaireItem step={2}>
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

            {/* Step 3: Primary Currency */}
            <QuestionnaireItem step={3}>
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
                {step > 1 && <QuestionnairePrevious>Previous</QuestionnairePrevious>}
                {step < 3 ? (
                    <QuestionnaireNext>Next</QuestionnaireNext>
                ) : (
                    <QuestionnaireSubmit onClick={handleSubmit}>
                        Complete Setup
                    </QuestionnaireSubmit>
                )}
            </QuestionnaireActions>
        </Questionnaire>
    )
}
