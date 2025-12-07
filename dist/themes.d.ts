export interface ColorTheme {
    name: string;
    tags?: string[];
    light: {
        primary: string;
        primaryShadow: string;
        accent: string;
        accentShadow: string;
        background: string;
        cardBackground: string;
        text: string;
        extra: string;
        h1Color: 'primary' | 'accent' | 'text';
        h2Color: 'primary' | 'accent' | 'text';
        h3Color: 'primary' | 'accent' | 'text';
    };
    dark: {
        primary: string;
        primaryShadow: string;
        accent: string;
        accentShadow: string;
        background: string;
        cardBackground: string;
        text: string;
        extra: string;
        h1Color: 'primary' | 'accent' | 'text';
        h2Color: 'primary' | 'accent' | 'text';
        h3Color: 'primary' | 'accent' | 'text';
    };
}
export declare const colorThemes: ColorTheme[];
export interface FontPairing {
    name: string;
    heading: string;
    headingStyle: string[];
    body: string;
    bodyStyle: string[];
}
export declare const fontPairings: FontPairing[];
//# sourceMappingURL=themes.d.ts.map