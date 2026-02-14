# Proposta de Alteração: globals.css

Para suportar ambos os modos, inverteremos a lógica atual. O `:root` passará a ter cores claras e a classe `.dark` conterá as cores escuras que você já utiliza.

```css
@layer base {
  :root {
    /* Light Mode - Cores Claras com tom azulado */
    --background: hsl(220 33% 98%);
    --foreground: hsl(224 71% 4%);
    --card: hsl(220 33% 98%);
    --card-foreground: hsl(224 71% 4%);
    --popover: hsl(220 33% 98%);
    --popover-foreground: hsl(224 71% 4%);
    --primary: hsl(263 70% 50%);
    --primary-foreground: hsl(210 40% 98%);
    --secondary: hsl(220 14% 90%);
    --secondary-foreground: hsl(224 71% 4%);
    --muted: hsl(220 14% 90%);
    --muted-foreground: hsl(220 9% 46%);
    --accent: hsl(263 70% 50% / 0.05);
    --accent-foreground: hsl(263 70% 50%);
    --destructive: hsl(0 84% 60%);
    --destructive-foreground: hsl(210 40% 98%);
    --border: hsl(220 13% 91%);
    --input: hsl(220 13% 91%);
    --ring: hsl(263 70% 50%);
    --radius: 0.75rem;
  }

  .dark {
    /* Dark Mode - Suas cores atuais */
    --background: hsl(240 10% 2.5%);
    --foreground: hsl(0 0% 98%);
    --card: hsl(240 10% 4.5%);
    --card-foreground: hsl(0 0% 98%);
    --popover: hsl(240 10% 2.5%);
    --popover-foreground: hsl(0 0% 98%);
    --primary: hsl(263 70% 50%);
    --primary-foreground: hsl(210 40% 98%);
    --secondary: hsl(240 3.7% 15.9%);
    --secondary-foreground: hsl(0 0% 98%);
    --muted: hsl(240 3.7% 15.9%);
    --muted-foreground: hsl(240 5% 64.9%);
    --accent: hsl(263 70% 50% / 0.1);
    --accent-foreground: hsl(210 40% 98%);
    --destructive: hsl(0 62.8% 30.6%);
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(240 3.7% 18%);
    --input: hsl(240 3.7% 18%);
    --ring: hsl(263 70% 50%);
  }
}
```

### Ajustes em Utilitários
Também precisaremos ajustar classes como `.text-gradient` para que no Light Mode elas usem cores mais escuras ou mantenham o contraste:

```css
  .text-gradient {
    /* No Light Mode, o gradiente vai de um cinza escuro para um mais claro */
    background: linear-gradient(to bottom right, var(--foreground), color-mix(in srgb, var(--foreground), transparent 40%));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .dark .text-gradient {
    /* No Dark Mode, mantém o branco atual */
    background: linear-gradient(to bottom right, white, color-mix(in srgb, white, transparent 50%));
  }
```
