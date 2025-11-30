Badminton tournament management system

A web application for managing badminton tournaments and tracking athlete statistics.
Built with Next.js, TypeScript, and MySQL.

# Key features

1. Dynamic bracket generation

Algorithm: uses a binary heap approach to calculate match trees.

Smart seeding: automatically handles empty slots by distributing players evenly to prevent "ghost matches".
Handles both singles (1v1) and doubles (2v2) logic automatically based on event category.

2. Validation

Input validation: strict constraints on tournament names (255 chars) and dates.

Logic validation: enforces official badminton scoring rules (e.g., must win by 2 points, hard cap at 30).

Automated QA: includes a custom set of tests (scripts/test-constraints.ts) that bombards the API with edge cases.

3. Organizer dashboard

Role-based access: dedicated admin views for creating events.

Live updates: update scores in real-time with visual bracket progression.

4. User profile and statistics

Personal dashboard: athletes can view their tournament registration history and upcoming matches.

Performance tracking: displays win/loss records and tournament participation stats.

Identity management: secure profile updates for skill levels and personal details.

# Tech stack

Frontend: Next.js (React), Tailwind CSS, Shadcn/UI

Backend: Next.js API Routes (Serverless Functions)

Database: MySQL (Raw SQL for performance & schema control)

Testing: Custom TypeScript Integration Scripts

Infrastructure: Docker (for Database containerization)

# Build history
The project was initialized and built using the following core commands:

1. Initialize Next.js project
pnpm create next-app --typescript

2. Install database driver
pnpm install mysql2

3. Setup UI components (shadcn)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card checkbox input label select tabs

4. Security utilities
pnpm install bcrypt @types/bcrypt


# How to run the constraint stress test

pnpm dlx tsx scripts/test-constraints.ts


# Getting started

1. Clone the repo

git clone [repo-url]
cd [repo-name]

2. Install dependencies

pnpm install

Note: If you see a warning about "Ignored build scripts" (specifically for bcrypt), run the command below. Select bcrypt from the menu.

pnpm approve-builds

3. Configure environment

Create .env file (NOT .env.local) in the project root directory and fill it with the contents below.

DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=enter_password
DB_NAME=badminton_db_dev

4. Start the database (Docker)
This project uses Docker Compose to run a local MySQL instance.

Start the database container

docker-compose up -d

5. Run development server

pnpm run dev

