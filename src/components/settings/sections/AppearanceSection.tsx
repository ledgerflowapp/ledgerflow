'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from "@/components/ui/icon"
import { Sun03Icon, MoonIcon, CheckIcon } from "@hugeicons/core-free-icons"
import { cn } from '@/lib/utils'

const ACCENT_COLORS = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Violet', value: 'violet', class: 'bg-violet-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
    { name: 'Slate', value: 'slate', class: 'bg-slate-500' },
]

export function AppearanceSection() {
    const { mode, themeSettings, updateThemeSettings, syncThemes, setSyncThemes } = useAppStore()

    const currentSettings = themeSettings?.[mode] || { theme: mode === 'business' ? 'light' : 'dark', accent: mode === 'business' ? 'blue' : 'green' }

    const handleThemeChange = (isDark: boolean) => {
        updateThemeSettings(mode, { ...currentSettings, theme: isDark ? 'dark' : 'light' })
    }

    const handleAccentChange = (accent: string) => {
        updateThemeSettings(mode, { ...currentSettings, accent })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                    Customize the look and feel for {mode} mode.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Label className="text-base">Theme</Label>
                        <div className="text-sm text-muted-foreground">
                            Select your preferred theme.
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted p-1 rounded-full shrink-0 min-h-12 sm:min-h-0">
                        <button
                            onClick={() => handleThemeChange(false)}
                            className={cn(
                                "flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-all min-h-11 sm:min-h-0",
                                currentSettings.theme === 'light'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon icon={Sun03Icon} className="h-4 w-4" />
                            Light
                        </button>
                        <button
                            onClick={() => handleThemeChange(true)}
                            className={cn(
                                "flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-all min-h-11 sm:min-h-0",
                                currentSettings.theme === 'dark'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon icon={MoonIcon} className="h-4 w-4" />
                            Dark
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Label className="text-base">Sync Themes</Label>
                        <div className="text-sm text-muted-foreground">
                            Use the same light/dark theme for both Business and Personal modes.
                        </div>
                    </div>
                    <div className="flex min-h-11 items-center">
                        <Switch
                            checked={syncThemes}
                            onCheckedChange={setSyncThemes}
                            className="data-[state=checked]:bg-primary h-6 w-11 shrink-0"
                            style={{ transform: 'scale(1.1)' }}
                        />
                    </div>
                </div>

                <div className="space-y-4 @container">
                    <Label className="text-base">Accent Color</Label>
                    <div className="grid grid-cols-3 @md:grid-cols-6 gap-4">
                        {ACCENT_COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => handleAccentChange(color.value)}
                                className={cn(
                                    "group relative flex min-h-14 w-full items-center justify-center rounded-xl border border-muted hover:border-primary transition-all",
                                    currentSettings.accent === color.value && "ring-2 ring-primary ring-offset-2 border-primary bg-primary/5"
                                )}
                            >
                                <div className={cn("h-8 w-8 rounded-full shadow-sm", color.class)} />
                                {currentSettings.accent === color.value && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Icon icon={CheckIcon} className="h-5 w-5 text-white drop-shadow-md" />
                                    </div>
                                )}
                                <span className="sr-only">{color.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
