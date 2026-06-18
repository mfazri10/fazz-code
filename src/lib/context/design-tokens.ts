/**
 * Design Token Extractor
 * Scans project files to extract design system tokens.
 */

export interface DesignTokens {
  colors: Record<string, string>;
  fonts: { heading?: string; body?: string; mono?: string };
  spacing: { section?: string; container?: string };
  borderRadius?: string;
  components: string[];
}

function extractCSSVariables(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const regex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const val = match[2];
    if (key && val) vars[key] = val.trim();
  }
  return vars;
}

function extractTailwindConfig(content: string): Partial<DesignTokens> {
  const tokens: Partial<DesignTokens> = {};

  const colorMatch = content.match(/colors?\s*:\s*\{([^}]+)\}/);
  if (colorMatch?.[1]) {
    const colors: Record<string, string> = {};
    const pairRegex = /(\w+)\s*:\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = pairRegex.exec(colorMatch[1])) !== null) {
      if (m[1] && m[2]) colors[m[1]] = m[2];
    }
    if (Object.keys(colors).length > 0) tokens.colors = colors;
  }

  const fontMatch = content.match(/fontFamily\s*:\s*\{([^}]+)\}/);
  if (fontMatch?.[1]) {
    const fonts: DesignTokens["fonts"] = {};
    const fontRegex = /(\w+)\s*:\s*\[([^\]]+)\]/g;
    let m;
    while ((m = fontRegex.exec(fontMatch[1])) !== null) {
      const name = m[1];
      const value = m[2]?.replace(/['"]/g, "").split(",")[0]?.trim();
      if (name && value) {
        if (name === "heading" || name === "sans") fonts.heading = value;
        else if (name === "mono") fonts.mono = value;
      }
    }
    tokens.fonts = fonts;
  }

  return tokens;
}

function detectComponents(files: Record<string, string>): string[] {
  const components: string[] = [];
  for (const path of Object.keys(files)) {
    const match = path.match(/components\/ui\/([\w-]+)\.tsx$/);
    if (match?.[1]) {
      const name = match[1]
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
      components.push(name);
    }
  }
  return components;
}

export function extractDesignTokens(files: Record<string, string>): DesignTokens {
  const tokens: DesignTokens = {
    colors: {},
    fonts: {},
    spacing: {},
    components: detectComponents(files),
  };

  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith("globals.css") || path.endsWith("theme.css")) {
      const vars = extractCSSVariables(content);

      const colorKeys = ["primary", "secondary", "accent", "background", "foreground", "muted", "destructive", "border"];
      for (const key of colorKeys) {
        if (vars[key]) tokens.colors[key] = vars[key];
      }
      if (vars["radius"]) tokens.borderRadius = vars["radius"];
    }

    if (path.includes("tailwind.config")) {
      const twTokens = extractTailwindConfig(content);
      if (twTokens.colors) tokens.colors = { ...tokens.colors, ...twTokens.colors };
      if (twTokens.fonts) tokens.fonts = { ...tokens.fonts, ...twTokens.fonts };
    }
  }

  return tokens;
}

export function formatTokensForPrompt(tokens: DesignTokens): string {
  const lines: string[] = [];

  if (Object.keys(tokens.colors).length > 0) {
    lines.push("## Design System — Colors");
    for (const [name, value] of Object.entries(tokens.colors)) {
      lines.push(`- ${name}: ${value}`);
    }
  }

  if (tokens.fonts.heading || tokens.fonts.body) {
    lines.push("\n## Typography");
    if (tokens.fonts.heading) lines.push(`- Heading: ${tokens.fonts.heading}`);
    if (tokens.fonts.body) lines.push(`- Body: ${tokens.fonts.body}`);
    if (tokens.fonts.mono) lines.push(`- Mono: ${tokens.fonts.mono}`);
  }

  if (tokens.borderRadius) {
    lines.push(`\n## Border Radius: ${tokens.borderRadius}`);
  }

  if (tokens.components.length > 0) {
    lines.push("\n## Installed Components (shadcn/ui)");
    lines.push(`Available: ${tokens.components.join(", ")}`);
    lines.push("Use these existing components when generating code.");
  }

  return lines.join("\n");
}
