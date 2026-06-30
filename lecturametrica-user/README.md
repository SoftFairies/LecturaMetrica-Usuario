# LecturaMetrica — App de Usuarios

Aplicación frontend para los usuarios de LecturaMetrica. Construida con Next.js 14 (App Router), React, TypeScript y Tailwind CSS.

## Estructura

```
app/
├── (auth)/          # Pantallas públicas: login, registro, recuperar contraseña
├── (app)/           # App principal: biblioteca, lectura, estadísticas, buzón
├── onboarding/      # Configuración inicial tras el registro
└── layout.tsx       # Layout raíz con ThemeProvider (modo oscuro/claro)

components/
├── AppSidebar.tsx   # Barra lateral plegable con perfil y modo claro
├── AuthLayout.tsx   # Layout dividido para pantallas de auth
├── BookCard.tsx     # Tarjeta de libro
├── ProfileModal.tsx # Modal de perfil con selector de avatar e insignias
├── ThemeProvider.tsx
└── ui/              # Button, Input

public/
├── avatars/         # 8 avatares SVG seleccionables
└── badges/          # 8 insignias SVG (se muestran según logros)
```

## Inicio rápido

```bash
npm install
npm run dev       # http://localhost:3000
```

## Credenciales demo

Cualquier correo y contraseña — redirige directo a /biblioteca.

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/register` | Registro → onboarding |
| `/onboarding` | Preferencias literarias |
| `/biblioteca` | Biblioteca personal |
| `/lectura` | Sesión de lectura con temporizador |
| `/estadisticas` | Gráficas de progreso |
| `/buzon` | Buzón literario anónimo |
