# 🎨 Modern UI Components Guide
## UNS-Shatak v2 - 社宅管理システム

Esta aplicación ahora cuenta con las **bibliotecas y componentes UI más modernos de 2025**.

---

## 📦 **Bibliotecas Instaladas**

### **Animaciones**
- ✨ **Framer Motion** (v11.11.17) - La mejor librería de animaciones React
  - Animaciones declarativas y fluidas
  - Layout animations automáticas
  - Gestos y drag & drop
  - [Documentación](https://motion.dev)

- 🌊 **Auto Animate** (v0.8.2) - Animaciones automáticas sin configuración
  - Detecta cambios en el DOM y anima automáticamente
  - Zero configuration
  - [Documentación](https://auto-animate.formkit.com)

### **Iconos**
- 🎯 **Lucide React** (v0.400.0) - 1000+ iconos modernos (ya instalado)
- 💎 **Phosphor React** (v1.4.1) - 9000+ iconos con múltiples estilos
  - Thin, Light, Regular, Bold, Fill, Duotone
  - [Ver iconos](https://phosphoricons.com)

- ⚡ **Tabler Icons** (v3.24.0) - 5000+ iconos SVG
  - Diseño consistente y moderno
  - [Ver iconos](https://tabler.io/icons)

### **Visualización de Datos**
- 📊 **Tremor** (v3.18.3) - Componentes premium para dashboards
  - Gráficos modernos pre-estilizados
  - Perfecto para analytics
  - [Documentación](https://www.tremor.so)

- 📈 **Visx** (v3.12.0) - Primitivos visuales de Airbnb
  - Altamente customizable
  - Basado en D3.js
  - [Documentación](https://airbnb.io/visx)

### **UI Avanzada**
- 🔔 **Sonner** (v1.7.0) - Toast notifications elegantes
- 🎭 **Vaul** (v1.1.1) - Drawers modernos
- 🌈 **React Hot Toast** (v2.4.1) - Notificaciones con estilo
- 📅 **React Day Picker** (v9.4.3) - Selector de fechas moderno
- 💀 **React Loading Skeleton** (v3.5.0) - Skeleton loaders elegantes
- 🎠 **Embla Carousel** (v8.5.1) - Carrusel moderno y accesible
- 🎪 **cmdk** (v1.0.4) - Command menu (Cmd+K)
- 🔐 **Input OTP** (v1.4.1) - Input de códigos OTP

### **Hooks Útiles**
- 🛠️ **react-use** (v17.5.1) - +100 hooks útiles
- 🎪 **usehooks-ts** (v3.1.0) - TypeScript hooks collection
- 📝 **React Wrap Balancer** (v1.1.1) - Balance de texto automático

### **Radix UI Primitivos** (Nuevos)
- Avatar, Progress, Separator, Tooltip, Popover, Accordion

---

## 🎯 **Componentes Modernos Creados**

### 1. **StatCard** - Tarjeta de Estadística Animada
Tarjeta con glassmorphism, animaciones y efectos hover.

```tsx
import { StatCard } from "@/components/modern";
import { Users } from "lucide-react";

<StatCard
  title="Total Employees"
  value={435}
  subtitle="従業員数"
  icon={Users}
  iconColor="text-green-500"
  trend={{ value: 12, isPositive: true }}
  gradient="from-green-500/10 to-blue-500/10"
  delay={0.1}
/>
```

**Características:**
- ✨ Animación de entrada con delay configurable
- 🎨 Gradiente customizable
- 📊 Indicador de tendencia (↑/↓)
- 🔄 Rotación del ícono al hover
- 📏 Borde animado en la parte inferior
- 🌟 Efecto glassmorphism

### 2. **GlassCard** - Tarjeta con Efecto Glassmorphism
Tarjeta con efecto de vidrio esmerilado moderno.

```tsx
import { GlassCard } from "@/components/modern";

<GlassCard
  blur="lg"
  gradient="from-white/40 to-white/10 dark:from-black/40 dark:to-black/10"
  hover={true}
>
  <div className="p-6">
    {/* Contenido */}
  </div>
</GlassCard>
```

**Props:**
- `blur`: "sm" | "md" | "lg" | "xl"
- `gradient`: String de gradiente Tailwind
- `hover`: Boolean para efecto hover

### 3. **AnimatedCounter** - Contador Numérico Animado
Contador que anima desde 0 hasta el valor final.

```tsx
import { AnimatedCounter } from "@/components/modern";

<AnimatedCounter
  value={1234}
  duration={2}
  prefix="$"
  suffix=" USD"
  decimals={2}
/>
```

**Características:**
- 🔢 Animación suave con spring physics
- 📍 Prefijo y sufijo personalizables
- 🎯 Control de decimales
- 👁️ Se activa al entrar en viewport

### 4. **FloatingParticles** - Partículas Flotantes de Fondo
Efecto de partículas flotantes para fondos.

```tsx
import { FloatingParticles } from "@/components/modern";

<div className="relative">
  <FloatingParticles count={30} />
  {/* Contenido */}
</div>
```

### 5. **AnimatedBackground** - Fondo Animado con Orbes
Fondo con orbes de colores en movimiento.

```tsx
import { AnimatedBackground } from "@/components/modern";

// En layout o página principal
<AnimatedBackground />
```

**Características:**
- 🌈 3 orbes de colores animados
- 🎨 Efecto de mezcla (mix-blend-multiply)
- 📐 Grid pattern sutil
- 🌙 Adapta a dark mode

### 6. **ProgressRing** - Anillo de Progreso Circular
Indicador de progreso circular animado.

```tsx
import { ProgressRing } from "@/components/modern";

<ProgressRing
  progress={75}
  size={120}
  strokeWidth={8}
  color="#3b82f6"
  label="Complete"
  showValue={true}
/>
```

### 7. **GradientText** - Texto con Gradiente Animado
Texto con gradiente de colores y animación opcional.

```tsx
import { GradientText } from "@/components/modern";

<GradientText
  gradient="from-blue-600 via-purple-600 to-pink-600"
  animate={true}
  className="text-4xl"
>
  UNS-Shatak 社宅管理
</GradientText>
```

### 8. **InteractiveCard** - Tarjeta Interactiva con Efecto Spotlight
Tarjeta con efecto de luz que sigue el cursor.

```tsx
import { InteractiveCard } from "@/components/modern";

<InteractiveCard>
  <div className="p-6">
    {/* Contenido */}
  </div>
</InteractiveCard>
```

**Efecto:**
- 💡 Spotlight radial que sigue el mouse
- 🎨 Perfecto para cards destacados
- ✨ Transición suave

### 9. **Shimmer** - Efecto Shimmer/Skeleton
Efecto de brillo para estados de carga.

```tsx
import { Shimmer } from "@/components/modern";

<div className="w-full h-20 bg-muted rounded-lg">
  <Shimmer />
</div>
```

---

## 🎨 **Animaciones Tailwind Personalizadas**

Se agregaron múltiples animaciones al `tailwind.config.js`:

```tsx
// Ejemplos de uso
<div className="animate-shimmer">...</div>
<div className="animate-slide-in-from-top">...</div>
<div className="animate-fade-in">...</div>
<div className="animate-zoom-in">...</div>
<div className="animate-spin-slow">...</div>
```

**Animaciones disponibles:**
- `animate-shimmer` - Efecto de brillo
- `animate-slide-in-from-top/bottom/left/right` - Deslizamiento
- `animate-fade-in/out` - Desvanecimiento
- `animate-zoom-in/out` - Zoom
- `animate-spin-slow` - Rotación lenta
- `animate-accordion-down/up` - Para acordeones

---

## 💡 **Cómo Usar**

### Instalación de Dependencias
```bash
cd frontend
npm install
# o
yarn install
```

### Importar Componentes Modernos
```tsx
// Importar componentes individuales
import { StatCard, GlassCard, AnimatedCounter } from "@/components/modern";

// Importar componentes UI base
import { Button, Card, Badge } from "@/components/ui";

// Importar nuevos componentes Radix
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
```

### Usar Framer Motion
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Contenido animado
</motion.div>
```

### Usar Auto Animate
```tsx
import { useAutoAnimate } from "@formkit/auto-animate/react";

function List() {
  const [parent] = useAutoAnimate();
  const [items, setItems] = useState([1, 2, 3]);

  return (
    <ul ref={parent}>
      {items.map(item => <li key={item}>{item}</li>)}
    </ul>
  );
}
```

### Usar Iconos Phosphor
```tsx
import { Heart, Star, User } from "phosphor-react";

<Heart size={32} weight="fill" color="#e74c3c" />
<Star size={24} weight="duotone" />
<User size={20} weight="bold" />
```

### Usar Tremor Charts
```tsx
import { Card, AreaChart, Title } from "@tremor/react";

const data = [
  { month: "Jan", sales: 2400 },
  { month: "Feb", sales: 1398 },
  // ...
];

<Card>
  <Title>Sales Overview</Title>
  <AreaChart
    data={data}
    index="month"
    categories={["sales"]}
    colors={["blue"]}
  />
</Card>
```

---

## 🎯 **Mejores Prácticas**

### 1. **Rendimiento**
- ✅ Usa `lazy loading` para componentes pesados
- ✅ Usa `useCallback` y `useMemo` con Framer Motion
- ✅ Limita el número de partículas flotantes (max 30)

### 2. **Accesibilidad**
- ✅ Todos los componentes Radix son accesibles por defecto
- ✅ Usa labels con inputs
- ✅ Agrega `aria-labels` cuando sea necesario

### 3. **Animaciones**
- ✅ Usa `prefers-reduced-motion` para usuarios sensibles
- ✅ Mantén duración de animaciones < 500ms para UI
- ✅ Usa `ease-out` para entradas, `ease-in` para salidas

### 4. **Theming**
- ✅ Todos los componentes respetan dark mode
- ✅ Usa variables CSS para colores consistentes
- ✅ Prueba en ambos temas siempre

---

## 📚 **Recursos Adicionales**

### Documentación Oficial
- [Framer Motion Docs](https://motion.dev)
- [Tremor Docs](https://www.tremor.so/docs)
- [Radix UI Docs](https://www.radix-ui.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Phosphor Icons](https://phosphoricons.com)
- [React Use Hooks](https://github.com/streamich/react-use)

### Inspiración de Diseño
- [Dribbble - Dashboard Designs](https://dribbble.com/tags/dashboard)
- [Behance - UI/UX](https://www.behance.net/search/projects?search=dashboard)
- [Awwwards](https://www.awwwards.com)

---

## 🚀 **Próximos Pasos**

1. **Actualizar Dashboard** con los nuevos componentes
2. **Agregar más animaciones** a las transiciones de página
3. **Implementar skeleton loaders** en todas las listas
4. **Crear más componentes** según necesidades
5. **Optimizar rendimiento** con React.memo y lazy loading

---

## ⚡ **Quick Start**

```tsx
// Ejemplo completo de uso
import { motion } from "framer-motion";
import { StatCard, GlassCard, AnimatedCounter } from "@/components/modern";
import { Users, Building2 } from "lucide-react";

export default function ModernDashboard() {
  return (
    <div className="space-y-6">
      {/* Fondo animado */}
      <AnimatedBackground />

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Employees"
          value={435}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <StatCard
          title="Total Buildings"
          value={256}
          icon={Building2}
          gradient="from-purple-500/10 to-pink-500/10"
          delay={0.1}
        />
      </div>

      {/* Glass Card */}
      <GlassCard blur="lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            <GradientText>Modern Design</GradientText>
          </h2>
          <p>Contenido con efecto glassmorphism</p>
        </div>
      </GlassCard>
    </div>
  );
}
```

---

**¡Disfruta de la UI más moderna de 2025!** 🎉
