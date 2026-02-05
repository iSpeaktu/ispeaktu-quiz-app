# iSpeaktu Quiz App - Color Scheme & Brand Guidelines

## Official Hex Color Palette

### Primary Brand Colors
| Color | Hex Code | Usage | Component |
|-------|----------|-------|-----------|
| **Primary Indigo** | `#4F46E5` | Main brand, buttons, navigation, progress bars | Logo, CTAs, quiz progress |
| **Conversational Track** | `#2563EB` | Conversational English track selection | Track card background (selected) |
| **Verified/Advanced** | `#059669` | Checkmarks, verification icons, Advanced tier | Lesson completion, feedback |
| **Business Track** | `#2563EB` | Business English track selection | Track card background (selected) |
| **Danger/Beginner** | `#E11D48` | Error states, Beginner feedback, alerts | Failure alerts, low scores |
| **Warning/Intermediate** | `#D97706` | Warning states, Intermediate feedback | Medium performance feedback |
| **Background Light** | `#F8FAFC` | Light backgrounds, subtle surfaces | Page background, card backgrounds |
| **Pure Black** | `#000000` | High contrast, premium elements | Teacher dashboard, badges, lesson items |
| **Pure White** | `#FFFFFF` | Text, overlays, contrast elements | Text on dark backgrounds |

## Component Color Mapping

### Navigation & Branding
- **Logo Text**: `#4F46E5` (Primary Indigo)
- **Active Nav Item**: `#4F46E5` (Primary Indigo)
- **Login Hero Background**: `#4F46E5` (Primary Indigo)

### Buttons & CTAs
| Button Type | Background Color | Hover State | Text Color |
|-------------|-----------------|-------------|-----------|
| Primary Action | `#4F46E5` | Opacity 0.9 | White |
| Verify/Approve | `#059669` | Opacity 0.9 | White |
| Teacher Login | `#4F46E5` | Opacity 0.9 | White |
| Reminder (Warning) | `#D97706` | Darker amber | White |

### Track Selection Cards
| Track | Background Color (Selected) | Border Color | Text Color |
|-------|---------------------------|-------------|-----------|
| Conversational | `#10B981` | `#10B981` | White |
| Business | `#000000` | `#000000` | White (premium black/white) |
| Unselected | `#FFFFFF` | `#E2E8F0` | Slate gray |

### Progress Indicators
| Indicator | Color | Purpose |
|-----------|-------|---------|
| Mastery Progress Bar | `#10B981` | Track-level completion (Conversational) |
| Lesson Completion Bar | `#4F46E5` | Individual lesson progress |
| Quiz Progress Bar | `#4F46E5` | Question-by-question progress |

### Lesson Status Icons
| Status | Background | Icon Color | Border |
|--------|-----------|-----------|--------|
| Verified ✓ | `#059669` | White | `#059669` |
| Awaiting Approval | `#FFFFFF` | Black | `#000000` |
| Locked | `#F1F5F9` | `#94A3B8` | Dashed |
| Not Started | `#F1F5F9` | `#94A3B8` | N/A |

### Feedback Tiers
| Tier | Percentage | Feedback Color | Background | Icon |
|------|-----------|----------------|-----------|------|
| Beginner | 0-30% | `#E11D48` | Light rose | ⚠️ |
| Elementary | 40-54% | `#D97706` | Light amber | 📊 |
| Pre-Intermediate | 55-69% | `#D97706` | Light amber | 📈 |
| Intermediate | 70-84% | `#2563EB` | Light blue | ✅ |
| Advanced | 85-100% | `#059669` | Light emerald | 🏆 |

### Teacher Dashboard
- **Table Headers**: `#F1F5F9` background, `#64748B` text
- **High Failure Rate**: `#E11D48` border, `#FEE2E2` background
- **Approve Button**: `#059669` background
- **Below 70% Label**: `#9CA3AF` text, `#F3F4F6` background
- **Action Icons**: `#94A3B8` hover → `#000000`

### Global Standing (Black & White Premium Section)
- **Background**: `#000000` (pure black)
- **Text**: `#FFFFFF` (pure white)
- **Stats Boxes**: `#FFFFFF` background, `#000000` text
- **Rank Number**: `#FFFFFF` (6xl font-black)
- **Trophy Icon**: `#FFFFFF` at 20% opacity

## Implementation in THEME Object

```javascript
const THEME = {
  colors: {
    primary: '#4F46E5',          // Indigo - Main brand
    conversational: '#10B981',   // Emerald - Conversational track
    verified: '#059669',         // Emerald dark - Verification/Advanced
    business: '#2563EB',         // Blue - Business track
    danger: '#E11D48',           // Rose - Errors/Beginner
    warning: '#D97706',          // Amber - Warnings/Intermediate
    neutral: '#F8FAFC',          // Slate - Backgrounds
    black: '#000000',
    white: '#FFFFFF'
  }
};
```

## Color Usage Rules

### ✅ DO
- Use `#4F46E5` for all primary CTAs and main interactions
- Use `#10B981` for Conversational track selection
- Use `#059669` for all verification checkmarks and Advanced tier displays
- Use `#2563EB` for Business track selection
- Use `#E11D48` for errors, low scores, and Beginner feedback
- Use `#D97706` for warnings and Intermediate feedback
- Maintain `#F8FAFC` for clean, light backgrounds

### ❌ DON'T
- Mix different shades of the same color (use only exact hex codes)
- Use colors from different categories interchangeably
- Override THEME colors with hardcoded Tailwind classes
- Use opacity that differs from design (0.9 for hover states only)

## Accessibility Notes
- **Contrast Ratios**: All color combinations meet WCAG AA standard
- **Beginner Feedback** (`#E11D48`): High contrast red for immediate attention
- **Advanced Feedback** (`#059669`): High contrast green for positive reinforcement
- **Text on Colors**: Always white (#FFFFFF) on dark backgrounds

## Brand Consistency Checklist
- [ ] All primary buttons use `#4F46E5`
- [ ] All verify/approve buttons use `#059669`
- [ ] Conversational track uses `#10B981` when selected
- [ ] Business track uses `#2563EB` when selected
- [ ] Verified checkmarks are `#059669`
- [ ] All progress bars use appropriate color (primary or conversational)
- [ ] Feedback tiers use correct colors (danger, warning, verified)
- [ ] Global Standing maintains black/white contrast
- [ ] No hardcoded Tailwind color classes in components
- [ ] All colors reference THEME object

## Future Color Changes
To update the entire color scheme globally, modify `src/App.js` lines 37-65 in the THEME object. All components automatically inherit the new colors.
