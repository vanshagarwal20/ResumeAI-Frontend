/**
 * Single source of truth for template metadata.
 * Used by both the editor's TemplateSwitcher and the dashboard's CreateResumeModal.
 */
const TEMPLATE_META = [
  {
    id: 1,
    name: 'Modern',
    icon: 'dashboard',
    accentColor: '#4f46e5',   // indigo
    description: 'Clean lines and ample whitespace for a contemporary look.',
  },
  {
    id: 2,
    name: 'Professional',
    icon: 'business_center',
    accentColor: '#1f2937',   // gray-900
    description: 'Traditional and structured, perfect for formal industries.',
  },
  {
    id: 3,
    name: 'Creative',
    icon: 'palette',
    accentColor: '#0d9488',   // teal-600
    description: 'Vibrant and bold, stands out in the creative field.',
  },
  {
    id: 4,
    name: 'Minimalist',
    icon: 'filter_none',
    accentColor: '#6b7280',   // gray-500
    description: 'Focuses on content with a clean, distraction-free layout.',
  },
];

export default TEMPLATE_META;
