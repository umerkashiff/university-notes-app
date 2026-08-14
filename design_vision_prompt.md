# UET CE Notes - UI/UX Design Vision & AI Image Generation Prompt

This document is designed to be fed into an Image Generating AI (like Midjourney, DALL-E 3, or Stable Diffusion) to generate high-fidelity UI mockups for the UET CE Notes application.

---

## AI Prompt (Copy and Paste this section)

**Prompt:**
> UI/UX design of a highly refined, premium university student portal and notes repository web application, mobile-first design shown on both a desktop monitor and an iPhone screen. 
> 
> The aesthetic is extremely clean, modern minimalist, and editorial, heavily inspired by Notion and Apple Books. The color palette is strictly limited to flat pastel and navy blue combinations: Deep Navy Blue (#111844), Soft Navy (#4B5694), Muted Light Blue-Grey (#7288AE), and Warm Pastel Beige (#EAE0CF). Absolutely NO gradients, NO 3D renders, and NO glossy/glassmorphic "AI slop" elements. Use solid blocks of color, sharp contrasts, and delicate, thin borders. 
> 
> The interface includes a sleek sidebar navigation, a global command-palette search bar (similar to macOS spotlight) in the center, and a notification bell icon. The main feed displays highly organized academic subjects and semesters in a clean grid of cards with subtle drop shadows. 
> 
> Show a custom, embedded PDF viewer taking up part of the screen, featuring an ultra-minimalist control bar (zoom, download, pagination) that looks exactly like the Apple Books reader interface but styled in navy blue and pastel beige. The typography must be very modern, geometric sans-serif, perfectly kerned, with a focus on negative space and readability. High-end Dribbble, Behance UI/UX, 8k resolution, flat vector aesthetic, premium web design.

---

## Core Application Vision & Feature Requirements

If you are working with a human designer or iterating on the design system, here is the complete breakdown of the app's vision:

### 1. Target Audience & Vibe
- **Audience:** Junior computer engineering students at university.
- **Vibe:** Highly academic but incredibly modern. It should feel like a high-end, premium tool (like Notion, Linear, or Raycast), not a clunky university portal. It must be completely devoid of generic "SaaS dashboard" templates.

### 2. Strict Design Constraints
- **Colors:** Deep Navy (#111844), Soft Navy (#4B5694), Light Blue-Grey (#7288AE), and Pastel Beige (#EAE0CF).
- **Rule:** **No gradients.** Use solid color blocks and pastel combinations to create depth.
- **Animations:** Must incorporate ReactBits-style animations (smooth typography reveals, spring-based hover interactions, layout morphs) that feel physical and highly refined. 
- **Typography:** Clean, sans-serif, mobile-first scaling.

### 3. Core Pages & Layouts

**A. Landing / Login Page**
- A beautiful, stark entryway.
- Collects specific student info: Registration Number, Phone Number, Batch, and Session.
- The transition between Login and Registration must be a fluid, animated layout shift.

**B. Student Dashboard (Mobile-First)**
- **Header:** Features a Notification Center (bell icon) and a global `Cmd+K` search bar (cmdk) for instant, keyboard-first navigation.
- **Feed:** A clean, organized feed of subjects and semesters. Notes uploaded by professors/admins appear here chronologically.
- **Cards:** Solid pastel cards on a navy background (or vice versa) with sharp, clean typography.

**C. Custom PDF Viewer (The "Apple Books" Experience)**
- A bespoke, embedded PDF viewer (no generic Google Drive iframes).
- The viewer controls (pagination, zoom, download) should float cleanly over the document in a solid-color control bar, looking as seamless and native as the Apple Books app.

**D. Admin CMS Portal**
- A protected route for admins to easily upload notes, select subjects, assign them to semesters, and manage the university taxonomy.
