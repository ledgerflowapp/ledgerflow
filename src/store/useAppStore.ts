import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserSettings, updateUserSettings } from '@/lib/actions/user-settings';

type AppMode = 'business' | 'personal';

interface ThemeSettings {
    theme: 'light' | 'dark';
    accent: string;
}

interface AppState {
    mode: AppMode;
    currentBusinessId: string | null;
    _hasHydrated: boolean;
    themeSettings: {
        business: ThemeSettings;
        personal: ThemeSettings;
    };
    syncThemes: boolean;
    toggleMode: () => void;
    setMode: (mode: AppMode) => void;
    setCurrentBusinessId: (id: string | null) => void;
    setHasHydrated: (state: boolean) => void;
    updateThemeSettings: (mode: AppMode, settings: ThemeSettings) => void;
    setSyncThemes: (enabled: boolean) => void;
    fetchThemeSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            mode: 'business', // Default
            currentBusinessId: null,
            _hasHydrated: false,
            themeSettings: {
                business: { theme: 'light', accent: 'blue' },
                personal: { theme: 'dark', accent: 'green' },
            },
            syncThemes: false,
            toggleMode: () => set((state) => ({
                mode: state.mode === 'business' ? 'personal' : 'business'
            })),
            setMode: (mode) => set({ mode }),
            setCurrentBusinessId: (id) => set({ currentBusinessId: id }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            updateThemeSettings: async (mode, settings) => {
                const state = get();
                const shouldSync = state.syncThemes;

                set((state) => {
                    const newSettings = { ...state.themeSettings };
                    newSettings[mode] = settings;

                    if (shouldSync) {
                        const otherMode = mode === 'business' ? 'personal' : 'business';
                        newSettings[otherMode] = {
                            ...newSettings[otherMode],
                            theme: settings.theme
                        };
                    }
                    return { themeSettings: newSettings };
                });

                try {
                    const updateData: Record<string, string> = mode === 'business'
                        ? { business_theme: settings.theme, business_accent: settings.accent }
                        : { personal_theme: settings.theme, personal_accent: settings.accent };

                    if (shouldSync) {
                        const otherMode = mode === 'business' ? 'personal' : 'business';
                        if (otherMode === 'business') updateData.business_theme = settings.theme;
                        else updateData.personal_theme = settings.theme;
                    }

                    await updateUserSettings(updateData);
                } catch {
                    // Ignore offline/guest errors
                }
            },
            setSyncThemes: async (enabled) => {
                const state = get();
                set({ syncThemes: enabled });

                if (enabled) {
                    const currentMode = state.mode;
                    const currentTheme = state.themeSettings[currentMode].theme;
                    const otherMode = currentMode === 'business' ? 'personal' : 'business';

                    set((s) => ({
                        themeSettings: {
                            ...s.themeSettings,
                            [otherMode]: {
                                ...s.themeSettings[otherMode],
                                theme: currentTheme
                            }
                        }
                    }));
                }

                try {
                    const updateData: Record<string, unknown> = { sync_themes: enabled };
                    if (enabled) {
                        const currentMode = state.mode;
                        const currentTheme = state.themeSettings[currentMode].theme;
                        updateData.business_theme = currentTheme;
                        updateData.personal_theme = currentTheme;
                    }
                    await updateUserSettings(updateData);
                } catch {
                    // Ignore offline/guest errors
                }
            },
            fetchThemeSettings: async () => {
                try {
                    const data = await getUserSettings();
                    if (data) {
                        set({
                            syncThemes: data.sync_themes,
                            themeSettings: {
                                business: { theme: data.business_theme as 'light' | 'dark', accent: data.business_accent },
                                personal: { theme: data.personal_theme as 'light' | 'dark', accent: data.personal_accent },
                            }
                        });
                    }
                } catch {
                    // Ignore offline/guest errors
                }
            }
        }),
        {
            name: 'app-preference', // Saves to localStorage
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
                state?.fetchThemeSettings() // Fetch fresh settings on hydration
            }
        }
    )
);
