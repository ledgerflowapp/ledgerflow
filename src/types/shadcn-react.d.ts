declare module "@shadcn/react/questionnaire" {
  import * as React from "react"

  export namespace Questionnaire {
    export const Root: React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { value?: any; onValueChange?: (val: any) => void }>
    export const Progress: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
    export const Item: React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { value?: string }>
    export const Title: React.ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
    export const Description: React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>
    export const Choices: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
    export const Choice: React.ComponentType<React.HTMLAttributes<HTMLLabelElement> & { value?: string }>
    export const ChoiceInput: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>
    export const ChoiceLabel: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
    export const ChoiceShortcut: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
    export const Input: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>
    export const Error: React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>
    export const Previous: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
    export const Skip: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
    export const Next: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
    export const Submit: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
  }
}
