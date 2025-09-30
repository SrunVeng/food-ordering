// Change this to set your app primary color everywhere.
export const theme = {
    primary: '#10b981', // emerald as default
};

// Apply CSS variables on startup (and you can re-call to switch themes)
export function applyTheme(root = document.documentElement) {
    root.style.setProperty('--color-primary', theme.primary);
}
