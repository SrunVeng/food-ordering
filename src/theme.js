// src/theme.js

// A "food brand" red with warm accents and clear contrast
export const theme = {
    primary: {
        50:  "#fff1f2",
        100: "#ffe4e6",
        200: "#fecdd3",
        300: "#fda4af",
        400: "#fb7185",
        500: "#f43f5e",
        600: "#e11d48", // main brand
        700: "#be123c",
        800: "#9f1239",
        900: "#881337",
    },
    // keep neutrals slightly warmer for food UI
    dishNeutral: {
        25:  "#fefefe",
        50:  "#faf9f8",
        100: "#f4f2f1",
        200: "#e8e5e3",
        300: "#d6d2cf",
        400: "#a7a19b",
        500: "#7b746e",
        600: "#5d5752",
        700: "#423d39",
        800: "#2b2724",
        900: "#171513",
    },
};

// Apply CSS variables so you can use them via Tailwind arbitrary values,
// e.g. bg-[var(--color-primary-600)]
export function applyTheme(colors = theme) {
    const root = document.documentElement;
    const set = (k, v) => root.style.setProperty(k, v);
    Object.entries(colors.primary).forEach(([shade, hex]) =>
        set(`--color-primary-${shade}`, hex)
    );
    Object.entries(colors.dishNeutral).forEach(([shade, hex]) =>
        set(`--color-dish-${shade}`, hex)
    );
}
