# Mobile Dashboard & PWA Implementation Plan

## Context
The user wants a "mobile version" PWA of the standard Dashboard, inspired by a modern operational CRM for restaurants but adapted for ClinicOS. The design should be colorful, playful, yet professional, using a specific "Sage Green / Off Black / Pale Yellow" palette.

## Goals
1.  Create a new `MobileDashboard.tsx` component designed specifically for mobile viewports.
2.  Implement the requested aesthetic (Rounded cards, Shadows, Sage Green background).
3.  Adapt "Restaurant" metrics to "Clinic" metrics.
4.  Ensure PWA capabilities (Viewport, Manifest check).
5.  Seamlessly switch between Desktop/Mobile dashboards.

## Design Adaptation (Restaurant -> Clinic)
- **Venue Capacity** -> **Clinic Occupancy** (Active appointments / Total slots).
- **Prime Cost Report** -> **Financial Report** (Revenue vs Expenses).
- **Average Order Value** -> **Average Ticket / Consult Value**.
- **Integrations** -> Keep (QuickBooks, etc. or Clinic specific).
- **Operational Timing** -> **Clinic Hours / Active Staff**.
- **Robot/Food Illustrations** -> **Medical Health Illustrations** (Playful style).

## Implementation Steps

### Phase 1: Foundation & Assets
- [ ] Create `components/mobile/MobileDashboard.tsx`.
- [ ] Define the Color Palette in Tailwind config or local CSS variables.
- [ ] Install/Setup playful icons (Lucide or specific SVGs).

### Phase 2: Component Construction
- [ ] **Top Navigation**: "Hi, [Name]", Location/Clinic Name, Notifications.
- [ ] **Reports Scroll**: Horizontal scroll card list (Financial, Occupancy, Satisfaction).
- [ ] **Capacity Chart**: Rechart line chart for appointment density.
- [ ] **Revenue Cards**: Gross Revenue, Average Ticket.
- [ ] **AI Assistant**: Chat interface preview.
- [ ] **Navigation**: Bottom Sheet or Tab Bar for mobile nav.

### Phase 3: Integration & Logic
- [ ] Connect `MobileDashboard` to existing `useQuery` hooks (Appointments, Financials).
- [ ] Implement `isMobile` detection hook.
- [ ] Update `pages/Dashboard.tsx` to conditionally render `MobileDashboard`.

### Phase 4: PWA Optimization
- [ ] Verify `manifest.json` icons and theme color.
- [ ] Ensure touch-target sizes (min 44px).
- [ ] Verify `viewport` meta tag for no-zoom.

## Questions for User
- Check standard ClinicOS branding vs New "Playful" Palette. (The user explicitly asked for this palette, so we will use it).
- confirm the metric mappings.

