# University Notes App

A modern, high-performance web application designed for university students to effortlessly share, discover, and organize academic resources. Built with Next.js, Prisma, Supabase, and Cloudflare R2, it features a highly scalable architecture capable of handling massive PDF uploads without compromising speed or user experience.

## Architecture

This application employs a decoupled storage strategy to maximize efficiency and bypass common hosting payload limits:
- **Frontend & Server Actions:** Powered by Next.js 14 and React Server Components.
- **Database:** Prisma ORM connected to a managed Supabase PostgreSQL instance.
- **Storage Layer:** All massive files (up to 100MB+) are stored in Cloudflare R2. 

Uploads circumvent standard server payload limits by utilizing an XHR direct-to-R2 approach. The Next.js server securely signs temporary URLs, allowing the browser to `PUT` PDFs directly into the Cloudflare bucket with real-time byte tracking.

## Features

- **Direct Cloudflare Uploads:** Seamlessly upload massive files with real-time UI progress tracking.
- **Storage Guard:** Built-in backend protections to prevent exceeding free-tier limits (Hard 9.5GB limit).
- **Admin Dashboard:** Comprehensive CMS for managing curriculum subjects, reviewing notes, and tracking storage health.
- **Native PDF Viewer:** Canvas-based PDF rendering using `react-pdf` for a premium reading experience.
- **Role-based Authentication:** Secure access control for Students, Seniors, and Administrators.

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:umerkashiff/university-notes-app.git
   cd university-notes-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example environment file and fill in your Supabase and Cloudflare credentials.
   ```bash
   cp .env.example .env.local
   ```

4. **Database Configuration:**
   Sync the Prisma schema with your database.
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to view the application.

## Technologies Used

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS, Framer Motion
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Storage:** Cloudflare R2, AWS S3 SDK
- **PDF Rendering:** React-PDF
