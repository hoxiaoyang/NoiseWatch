# UI Component Reference

This document provides a quick reference for all reusable UI components in the NoiseWatch application.

## Button Component

### Props
- `variant`: 'primary' | 'secondary' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- All standard HTML button props

### Usage
```tsx
import { Button } from './components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="success" size="lg" fullWidth disabled={loading}>
  {loading ? 'Loading...' : 'Submit'}
</Button>
```

### Variants
- **Primary**: Blue background, for main actions
- **Secondary**: Gray background, for secondary actions
- **Danger**: Red background, for destructive actions
- **Success**: Green background, for confirmation actions

---

## Card Components

### Card
Main container component

### CardHeader
Header section with border-bottom

### CardTitle
Title within the header

### CardContent
Main content area with padding

### Usage
```tsx
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <p className="text-sm text-gray-600">Subtitle text</p>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

---

## Input Component

### Props
- `label`: string - Label text above input
- `error`: string - Error message to display
- `helperText`: string - Helper text below input
- All standard HTML input props

### Usage
```tsx
import { Input } from './components/ui/Input';

<Input
  label="Block Number"
  placeholder="e.g., 123"
  value={blockNumber}
  onChange={(e) => setBlockNumber(e.target.value)}
  error={errors.blockNumber}
  helperText="Enter your HDB block number"
  required
/>
```

### Features
- Automatic ID generation from label
- Error state styling (red border)
- Helper text support
- Focus state with blue ring

---

## TextArea Component

### Props
- `label`: string - Label text above textarea
- `error`: string - Error message to display
- `helperText`: string - Helper text below textarea
- All standard HTML textarea props

### Usage
```tsx
import { TextArea } from './components/ui/Input';

<TextArea
  label="Description"
  placeholder="Describe the noise..."
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  error={errors.description}
  rows={4}
  helperText="Provide as much detail as possible"
/>
```

---

## Styling Guidelines

### Colors
```css
/* Primary */
blue-600: #2563eb
blue-700: #1d4ed8

/* Success */
green-600: #16a34a
green-700: #15803d

/* Danger */
red-600: #dc2626
red-700: #b91c1c

/* Secondary */
gray-100: #f3f4f6
gray-600: #4b5563
gray-900: #111827
```

### Spacing
- Card padding: px-6 py-4
- Form field spacing: space-y-4 or space-y-5
- Button padding: Small (px-3 py-1.5), Medium (px-4 py-2), Large (px-6 py-3)

### Typography
- Headings: font-semibold or font-bold
- Body text: text-base (16px)
- Small text: text-sm (14px)
- Tiny text: text-xs (12px)

### Shadows
- Card: shadow-md
- Hover effects: hover:shadow-lg
- Focus: focus:ring-2 focus:ring-blue-500

### Borders
- Default: border border-gray-200
- Radius: rounded-lg (8px)
- Focus: focus:border-transparent

---

## Icon Usage

All icons use Heroicons (outline style) via inline SVG:

```tsx
<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
</svg>
```

Common sizes:
- Small icon: w-4 h-4
- Medium icon: w-5 h-5
- Large icon: w-6 h-6

---

## Responsive Design

### Breakpoints
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Common Patterns
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">

// Full width on mobile, auto on desktop
<div className="w-full md:w-auto">

// 1 column mobile, 2 columns desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:flex">
```

---

## Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation support
- Focus indicators
- Error announcements
- Semantic HTML

### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### Color Contrast
All text meets WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio

---

## Animation Classes

```css
/* Fade in */
.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out;
}

/* Slide up */
.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}

/* Spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}
```

---

## Best Practices

1. **Always provide labels** for form inputs
2. **Include helper text** to guide users
3. **Show error messages** inline with fields
4. **Use appropriate button variants** for actions
5. **Maintain consistent spacing** throughout
6. **Test responsive behavior** on multiple devices
7. **Ensure keyboard accessibility** for all interactive elements
8. **Provide loading states** for async operations
