# LUNAS | Technical Assessment

Build a mini web application using React and Three.js — an interactive
3D globe for exploring countries of the world and related functionality. 

## TASK

### Core Functionality
- [ ] 3D scene with a globe
- [ ] Camera navigation in 3D space
- [ ] Country visualization on the globe
- [ ] Interactivity: click to select a country
- [ ] Display detailed information about the selected country
- [ ] Country data loaded dynamically from the public API restcountries.com
- [ ] All Three.js logic implemented within the three-kvy-core library
- [ ] Full mobile support

### Country List & Synchronization
- [ ] Country list in the UI with search by name
- [ ] Synchronized hover / select state between the list and the globe

### Table, Filtering & Virtualization
- [ ] Filtering and sorting the country list by various parameters, rendered as a table using
@tanstack/react-table
- [ ] Infinite scroll with virtualization (powered by @tanstack/*)
  
### Creative 3D Level
- [ ] Visual effects on hover, click and country selection
- [ ] Globe appearance customization using shaders or other tools/approaches
- [ ] Light / dark theme toggle

> [!NOTE]
> Note on prioritization. The approach to country visualization on the globe is intentionally left open — different implementations imply different levels of complexity and 3D expertise. If you feel confident in certain areas or see more creative potential in specific tasks, prioritize accordingly. The full Level 0 task pool is mandatory. Additional creative contributions are always welcome.

## TECH REQ'S
### Project setup
- Vite
- TypeScript
- React 19.2+
- ESLint — @tanstack/eslint-config
- Prettier — config from web-configs
- npm ≥ 10.2.4, node ≥ 20.11.0

### Data & State
- Requests & caching — @tanstack/react-query
- Any state manager is allowed; minimize global stores
- Prefer binding state to specific entities / class instances
- Events (if needed) — eventemitter3

### Three.js
- Three.js r183 + WebGPURenderer
- All 3D logic via three-kvy-core
- Shaders — TSL
- Animations — tween.js
- Camera navigation — camera-controls

### UI & Styling
- Styles — Tailwind CSS v4
- Utilities — clsx + tailwind-merge
- Use base-ui components wherever possible
- Avoid props drilling
- Minimize imperative code in React components