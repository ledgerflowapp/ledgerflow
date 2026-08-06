# 04 — Onboarding Questionnaire Wizard Integration

**What to build:**
A multi-step onboarding wizard powered by `questionnaire.tsx` that guides newly registered profiles through configuring their primary Workspace Mode (Personal vs Business), default accent palette, and primary currency settings.

**Blocked by:** 01 — Base UI Toast Engine Expansion & Root Layout Setup

**Status:** completed

- [x] An `OnboardingWizard` component is created utilizing `Questionnaire`, `QuestionnaireChoices`, `QuestionnaireChoice`, `QuestionnaireNext`, and `QuestionnairePrevious`.
- [x] Users can select their initial Workspace Mode (Personal vs Business), which correctly sets theme/accent boundaries.
- [x] Step progress indicator tabular text and progress indicators dynamically update as users navigate steps.
- [x] Completing the wizard saves user preferences and triggers a success toast notification via Base UI `toast.success`.
