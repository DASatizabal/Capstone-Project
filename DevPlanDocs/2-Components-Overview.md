# FeNAgO Components Overview

## UI Component Structure

The FeNAgO project has a rich set of pre-built UI components to accelerate development. These components are located in the `/components` directory and follow a flat organization structure with semantic naming.

## Core Components

### Layout Components

| Component | Description |
|-----------|-------------|
| `LayoutClient.tsx` | Client-side wrapper component with providers for Crisp chat, toast notifications, etc. |
| `Header.tsx` | Main navigation header with responsive mobile menu |
| `Footer.tsx` | Site footer with links and branding |

### Authentication Components

| Component | Description |
|-----------|-------------|
| `ButtonSignin.tsx` | Sign-in button that integrates with NextAuth |
| `ButtonAccount.tsx` | User account dropdown menu for authenticated users |

### Page Section Components

| Component | Description |
|-----------|-------------|
| `Hero.tsx` | Hero section typically used at the top of landing pages |
| `CTA.tsx` | Call-to-action section for converting visitors |
| `FAQ.tsx` | Frequently asked questions section with expandable items |
| `Pricing.tsx` | Pricing table displaying different subscription plans |
| `Problem.tsx` | Problem-solution section for explaining product value |

### Feature Display Components

| Component | Description |
|-----------|-------------|
| `FeaturesGrid.tsx` | Grid layout for displaying features with icons |
| `FeaturesAccordion.tsx` | Accordion-style feature display |
| `FeaturesListicle.tsx` | List-style feature display with detailed descriptions |
| `WithWithout.tsx` | Comparison component showing benefits with/without the product |

### Testimonial Components

| Component | Description |
|-----------|-------------|
| `Testimonials1.tsx` | Simple testimonial display |
| `Testimonials3.tsx` | Three-column testimonial layout |
| `Testimonials11.tsx` | More complex testimonial display with ratings |
| `TestimonialsAvatars.tsx` | Avatar-focused testimonial display |
| `TestimonialRating.tsx` | Testimonial with star ratings |
| `Testimonial1Small.tsx` | Compact testimonial component |

### Interactive UI Components

| Component | Description |
|-----------|-------------|
| `ButtonCheckout.tsx` | Button for initiating Stripe checkout |
| `ButtonGradient.tsx` | Styled button with gradient effect |
| `ButtonLead.tsx` | Button for lead generation forms |
| `ButtonPopover.tsx` | Button that opens a popover/modal |
| `ButtonSupport.tsx` | Button for accessing customer support (Crisp) |
| `Modal.tsx` | Reusable modal dialog component |
| `Tabs.tsx` | Tabbed interface component |

### Utility Components

| Component | Description |
|-----------|-------------|
| `BetterIcon.tsx` | Enhanced icon component with additional styling options |

## Component Patterns

### Composition Pattern

Many components follow a composition pattern where smaller components are combined to create more complex UI elements. For example, the `Hero.tsx` component may include buttons from `ButtonSignin.tsx` or `ButtonGradient.tsx`.

### Props Interface Pattern

Components typically define TypeScript interfaces for their props, enhancing type safety and developer experience.

### Responsive Design

Components use Tailwind CSS classes for responsive design, adapting to different screen sizes. Most components include mobile-first design with breakpoints for tablet and desktop views.

### Tailwind/DaisyUI Integration

Components leverage DaisyUI components and Tailwind utility classes for styling, providing a consistent design language across the application.

## Example Component Structure

A typical component follows this structure:

```tsx
// Import statements
import { useState } from "react";
import Image from "next/image";

// Props interface definition
interface ComponentProps {
  title: string;
  description?: string;
  imageSrc: string;
}

// Component definition
const Component = ({ title, description, imageSrc }: ComponentProps) => {
  // State/hooks if needed
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Rendering logic with Tailwind CSS classes
  return (
    <div className="bg-base-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold">{title}</h2>
      {description && <p className="mt-2 text-base-content/80">{description}</p>}
      <Image 
        src={imageSrc} 
        alt={title} 
        width={500} 
        height={300} 
        className="mt-4 rounded-md"
      />
      <button 
        className="btn btn-primary mt-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Show Less" : "Show More"}
      </button>
      {isExpanded && (
        <div className="mt-4 p-4 bg-base-200 rounded-md">
          Extended content here...
        </div>
      )}
    </div>
  );
};

export default Component;
```

## Customization Guidelines

When customizing existing components or creating new ones:

1. **Maintain Naming Conventions**: Follow the established naming patterns
2. **Props Typing**: Always define TypeScript interfaces for props
3. **Responsive Design**: Ensure components work on all screen sizes
4. **Theme Compatibility**: Use DaisyUI theme variables for colors
5. **Accessibility**: Include proper ARIA attributes and semantic HTML
6. **Reusability**: Design components to be reusable across different contexts
