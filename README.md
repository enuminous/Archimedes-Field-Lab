# Archimedes Engine — Field-Native Lab

<!-- ENUMINOUS-UNIFIED-NAV:START -->
## Repository navigation

**eNuminous network:** [All public repositories](https://github.com/enuminous/EFMW/blob/main/REPOSITORY_NAVIGATION.md) · [EFMW](https://github.com/enuminous/EFMW) · [102 equations](https://github.com/enuminous/Monolithic_102_EFMW) · [Frozen Lean](https://github.com/enuminous/Monolithic-102-Zoo-Lean4) · [Zoo](https://github.com/enuminous/Tortoise) · [Papers](https://github.com/enuminous/papers) · [Quantum geometry](https://github.com/enuminous/Base888-Quantum-Geometry)

**This project:** [Repository home](https://github.com/enuminous/Archimedes-Field-Lab) · [Subject index](https://github.com/enuminous/EFMW/blob/main/REPOSITORY_NAVIGATION.md#simulators-computation-and-experiments) · [Published site](https://enuminous.github.io/Archimedes-Field-Lab/) · [Web application](index.html)

<details open>
<summary><strong>On this page</strong></summary>

- [What is implemented in v0.1](#what-is-implemented-in-v01)
- [Scientific status](#scientific-status)
- [Run](#run)
- [Controls](#controls)
- [Architecture target](#architecture-target)
- [Suggested next milestone](#suggested-next-milestone)


</details>

**Related repositories:** [Coherence-Prediction-Engine](https://github.com/enuminous/Coherence-Prediction-Engine) · [Archimedes-3D](https://github.com/enuminous/Archimedes-3D) · [OpenAI-math](https://github.com/enuminous/OpenAI-math) · [Archimedes-Engine](https://github.com/enuminous/Archimedes-Engine) · [EFMW](https://github.com/enuminous/EFMW) · [papers](https://github.com/enuminous/papers)

> **Evidence boundary:** A link between projects is navigation, not an assertion of proven equivalence, experimental validation, or shared authorship. See each repository’s own status and review notes.
<!-- ENUMINOUS-UNIFIED-NAV:END -->


A playable prototype for a walk-around scientific puzzle/building sandbox combining established physics models with an explicitly separated EFMW experimental-field layer.

## What is implemented in v0.1

- First-person walk-around 3D laboratory
- Build / explore modes
- Place, rotate, delete and inspect components
- Build palette: Structures, Mechanics, Optics, Chemistry, Waves, Electricity, Quantum, EFMW
- Live analysis HUD with Classical / Quantum / Gravity / EFMW tabs
- Demonstrator pendulum dynamics
- Optical bench visualization with laser path
- Wave-table animation
- Chemistry vessel state placeholders (temperature, pressure, species)
- Electrical coil state placeholder
- Local quantum subsystem demonstrator
- EFMW field visualizer demonstrator, explicitly marked experimental
- Modular code structure intended for replacement with progressively more rigorous solvers

## Scientific status

This repository deliberately separates:

1. established physics approximations,
2. research/advanced models,
3. EFMW hypotheses.

The v0.1 EFMW field is **not** presented as validated physics. It is a bounded visual/numerical demonstrator until symbol definitions, units, coupling constants, boundary conditions, and validation tests are frozen.

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL.

## Controls

- Click viewport — enter mouse-look in Explore mode
- WASD — move
- B — toggle Build / Explore
- Click in Build mode — place selected component
- R — rotate build ghost / selection
- X — delete selected placed component
- M — toggle measurement mode
- Space — pause/resume simulation

## Architecture target

The intended full engine evolves a shared world state with multiple solver layers:

- rigid body / mechanics
- thermodynamics
- fluids
- chemistry
- electromagnetism
- optics and waves
- localized quantum subsystems
- gravity / relativity modules
- EFMW candidate field + recursive-state models
- instrumentation and puzzle conditions

The guiding rule is: **if the player can build it, the simulator should calculate it.**

## Suggested next milestone

Replace demonstrators with testable solver modules in this order:

1. rigid-body collision + constraints
2. ray optics
3. scalar waves / resonance
4. DC circuits
5. thermodynamics
6. chemistry kinetics
7. fluid flow approximation
8. quantum circuit / interferometer module
9. curved-spacetime laboratory module
10. canonical EFMW equation module with fixed units and falsifiable tests
