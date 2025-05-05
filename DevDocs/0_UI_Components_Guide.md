# UI Components Guide for FeNAgO

## Components Framework

Your application is built with:

1. **Next.js** - The React framework that provides routing, server components, and build optimization
2. **React** - The underlying library for creating UI components
3. **TypeScript** - For type safety (your files use .tsx extension)

## UI Library

The FeNAgO project uses:

- **DaisyUI** - A component library built on top of Tailwind CSS (referenced in your config.ts file)
- **Tailwind CSS** - A utility-first CSS framework for styling components

## Finding and Using Components

### DaisyUI Components

DaisyUI provides a comprehensive set of pre-styled components that work with Tailwind CSS. These components are already configured in your project and ready to use.

- **Official documentation**: [daisyui.com/components](https://daisyui.com/components/)
- **Examples**: buttons, cards, modals, forms, dropdowns, etc.
- **Usage example**:
  ```jsx
  <button className="btn btn-primary">Button</button>
  <div className="card w-96 bg-base-100 shadow-xl">...</div>
  ```

### Tailwind CSS Utilities

Tailwind CSS provides utility classes for building custom components when DaisyUI doesn't offer what you need.

- **Official documentation**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Examples**: flex layouts, padding, margin, colors, typography, etc.
- **Usage example**:
  ```jsx
  <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
    <h2 className="text-xl font-bold text-gray-800">Custom Component</h2>
    <p className="text-sm text-gray-600">Using Tailwind utilities</p>
  </div>
  ```

## Additional Component Libraries

When you need more specialized components, consider these libraries that work well with Next.js and Tailwind CSS:

### Headless UI

Unstyled, accessible components that you can style with Tailwind CSS.

- **Official documentation**: [headlessui.com](https://headlessui.com/)
- **Examples**: comboboxes, dialogs, disclosure panels, listboxes, etc.
- **Installation**: `npm install @headlessui/react`

### Radix UI

Low-level, accessible components for building high-quality design systems.

- **Official documentation**: [radix-ui.com](https://www.radix-ui.com/)
- **Examples**: tooltips, popovers, context menus, select menus, etc.
- **Installation**: `npm install @radix-ui/react-{component-name}`

### Shadcn UI

Beautifully designed components built with Radix UI and Tailwind CSS.

- **Official documentation**: [ui.shadcn.com](https://ui.shadcn.com/)
- **Examples**: calendars, data tables, tabs, toasts, etc.
- **Installation**: Components are copied into your project rather than installed as a dependency

## Next.js Specific Components

### Next.js Built-in Components

Next.js provides several components for common functionality:

- **Image**: Optimized image loading (`import Image from 'next/image'`)
- **Link**: Client-side navigation (`import Link from 'next/link'`)
- **Script**: JavaScript loading strategies (`import Script from 'next/script'`)
- **Font**: Web font optimization (`import { Inter } from 'next/font/google'`)

### App Router Components

If you're using Next.js 13+ with the App Router:

- **Server Components**: Default in the App Router, no client-side JavaScript
- **Client Components**: Add `'use client'` at the top of the file for interactive components

## Building Custom Components

When creating your own components for FeNAgO:

1. **Place in the components directory**: `/components/{ComponentName}.tsx`
2. **Use TypeScript interfaces** for props:
   ```tsx
   interface ButtonProps {
     text: string;
     onClick: () => void;
     variant?: 'primary' | 'secondary';
   }
   ```
3. **Export as default** or named export:
   ```tsx
   export default function Button({ text, onClick, variant = 'primary' }: ButtonProps) {
     return (
       <button 
         onClick={onClick}
         className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
       >
         {text}
       </button>
     );
   }
   ```

## Best Practices

1. **Maintain consistency** across your application by reusing components
2. **Create component variants** instead of one-off designs
3. **Use TypeScript** for better type safety and autocompletion
4. **Make components responsive** using Tailwind's responsive modifiers
5. **Consider accessibility** when building or selecting components

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Documentation](https://daisyui.com/docs/install/)
- [TypeScript React Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

This guide should help you understand the component ecosystem in your FeNAgO project and provide resources for finding additional components to enhance your application.
