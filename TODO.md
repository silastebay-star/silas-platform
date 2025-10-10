# SILAS Platform: Development Roadmap & To-Do List

## 1. Introduction

This document outlines the development plan for the SILAS platform. It is a living document designed to guide a world-class development team (human or AI) in building the platform as specified in the Functional Design Document.

**Core Technologies:**
*   **Framework:** Next.js (App Router)
*   **Database & Auth:** Supabase (PostgreSQL with PostGIS)
*   **Mapping:** Mapbox
*   **Styling:** Tailwind CSS & shadcn/ui
*   **State Management:** Zustand

---

## 2. Phase 1: Foundational Backend & Core Models (Supabase)

This phase focuses on establishing a robust database schema in Supabase. This is the bedrock of the entire platform.

### 2.1. Database Schema Definition

**Objective:** Create the necessary tables and relationships in Supabase to support the platform's core entities. Use the Supabase UI or migration scripts.

*   **`profiles` Table (Supabase `auth.users` extension)**
    *   `id`: `uuid` (Primary Key, Foreign Key to `auth.users.id`)
    *   `display_name`: `text`
    *   `role`: `text` (Enum: `observer`, `participant`, `doer`, `owner`, `admin`)
    *   `verified`: `boolean` (default: `false`)
    *   `metadata`: `jsonb`

*   **`pins` Table**
    *   `id`: `uuid` (Primary Key)
    *   `title`: `text`
    *   `description`: `text`
    *   `categories`: `_text` (Array of `CategoryKey`)
    *   `project_id`: `uuid` (Foreign Key to `projects.id`, nullable)
    *   `group_id`: `uuid` (Foreign Key to `groups.id`, nullable)
    *   `author_id`: `uuid` (Foreign Key to `profiles.id`)
    *   `geom`: `geometry(Point, 4326)` (PostGIS type for lat/lng)
    *   `status`: `text` (Enum: `draft`, `proposed`, `published`, `archived`, `deleted`)
    *   `metadata`: `jsonb` (For category-specific data, e.g., `{ "pin_type": "roadworks_repair", "severity": "high" }`)
    *   `created_at`: `timestamp with time zone`
    *   `updated_at`: `timestamp with time zone`

*   **`groups` Table**
    *   `id`: `uuid` (Primary Key)
    *   `name`: `text`
    *   `description`: `text`
    *   `owner_id`: `uuid` (Foreign Key to `profiles.id`)
    *   `public`: `boolean` (default: `true`)
    *   `metadata`: `jsonb`
    *   `created_at`: `timestamp with time zone`

*   **`group_members` Table (Many-to-Many for Groups and Profiles)**
    *   `group_id`: `uuid` (Foreign Key to `groups.id`)
    *   `profile_id`: `uuid` (Foreign Key to `profiles.id`)
    *   `role`: `text` (Enum: `member`, `moderator`, `admin`)
    *   `joined_at`: `timestamp with time zone`

*   **`projects` Table**
    *   `id`: `uuid` (Primary Key)
    *   `name`: `text`
    *   `description`: `text`
    *   `group_id`: `uuid` (Foreign Key to `groups.id`)
    *   `status`: `text`
    *   `metadata`: `jsonb`
    *   `created_at`: `timestamp with time zone`
    *   `updated_at`: `timestamp with time zone`

*   **`proposals` Table**
    *   `id`: `uuid` (Primary Key)
    *   `pin_id`: `uuid` (Foreign Key to `pins.id`, nullable)
    *   `proposer_id`: `uuid` (Foreign Key to `profiles.id`)
    *   `action`: `text` (Enum: `create_pin`, `edit_pin`, `delete_pin`, `fund_request`)
    *   `payload`: `jsonb` (The proposed changes)
    *   `status`: `text` (Enum: `pending`, `approved`, `rejected`)
    *   `created_at`: `timestamp with time zone`
    *   `reviewed_at`: `timestamp with time zone` (nullable)

*   **`votes` Table**
    *   `id`: `uuid` (Primary Key)
    *   `proposal_id`: `uuid` (Foreign Key to `proposals.id`)
    *   `voter_id`: `uuid` (Foreign Key to `profiles.id`)
    *   `vote`: `text` (Enum: `yes`, `no`, `abstain`)
    *   `created_at`: `timestamp with time zone`
    *   **Constraint:** One vote per voter per proposal.

*   **`comments` Table**
    *   `id`: `uuid` (Primary Key)
    *   `pin_id`: `uuid` (Foreign Key to `pins.id`)
    *   `author_id`: `uuid` (Foreign Key to `profiles.id`)
    *   `content`: `text`
    *   `parent_comment_id`: `uuid` (Foreign Key to `comments.id`, nullable for threading)
    *   `created_at`: `timestamp with time zone`

### 2.2. Setup Row-Level Security (RLS)

**Objective:** Implement basic RLS policies for all tables to ensure data security from the start.

*   **`pins`:** Publicly readable, but only editable by author or group admin.
*   **`groups`:** Publicly readable, membership changes require auth.
*   **`votes`:** Readable by all, writable only once per user per proposal.
*   **`comments`:** Readable by all, writable by authenticated users.
*   **`profiles`:** Publicly readable, only editable by the user themselves.

### 2.3. Create API Endpoints (Next.js API Routes)

**Objective:** Create a basic set of API routes to interact with the database.

*   `GET /api/pins`: Fetch pins (with filters for category, bbox, etc.).
*   `POST /api/pins`: Create a new pin.
*   `GET /api/pins/[id]`: Fetch a single pin.
*   `PUT /api/pins/[id]`: Update a pin.
*   `GET /api/groups`: Fetch all groups.
*   `POST /api/proposals`: Create a new proposal.
*   `POST /api/votes`: Cast a vote on a proposal.

---

## 3. Phase 2: Map Interface & Core Functionality

**Objective:** Bring the map to life with real data and basic user interactions.

*   **Task 3.1: Connect Map to Backend**
    *   Modify `usePinsStore` (or equivalent) to fetch pins from `/api/pins`.
    *   Display real pins on the `MapView` component.
    *   Ensure pin clustering works with live data.

*   **Task 3.2: Implement Pin Creation**
    *   Create a "Create Pin" form inside the `AddPinModal`.
    *   The form should include fields for title, description, category, and location (set from map click).
    *   On submit, POST to `/api/pins` and optimistically update the map.

*   **Task 3.3: Implement Pin Detail View**
    *   When a pin is clicked, open the `PinSidebar` or a similar component.
    *   Fetch detailed data for the selected pin from `/api/pins/[id]`.
    *   Display the pin's title, description, author, etc.

*   **Task 3.4: Implement Pin Comments**
    *   Create a `CommentList` component.
    *   Fetch comments for the current pin.
    *   Create a `CommentForm` to allow users to post new comments.
    *   Implement optimistic updates for new comments.

---

## 4. Phase 3: Full Category Implementation

**Objective:** Build out the unique features for each category page, replacing the current mock data with functional components.

*   **Task 4.1: Infrastructure & Planning**
    *   Integrate the `ProposalList` component to show real proposals fetched from the backend.
    *   Create a "Create Proposal" form.
    *   Implement the frontend and backend logic for the `VotingEngine`.
    *   Display real-time vote counts.

*   **Task 4.2: Environment & Ecology**
    *   Enhance the "Create Pin" form to support different environmental pin types (e.g., "Pollution Report"). Use the `metadata` field.
    *   Create a `SpeciesLogbook` component.
    *   Investigate and plan for connecting to live sensor data via a service like an MQTT broker or a simple REST endpoint.

*   **Task 4.3: Housing & Community Life**
    *   Build the `ResidentRegistry` component (ensure it's opt-in).
    *   Develop the `NeighborhoodFeed` component, filtering posts by geographic area.
    *   Implement the `SecurityAlerts` system (requires push notifications).

*   **Task 4.4: Business & Enterprise**
    *   Create the `BusinessDirectory` component with filtering.
    *   Implement the micro-funding request flow, linking to the `proposals` system.

*   **Task 4.5: Arts & Culture**
    *   Build the `EventCalendar` component, syncing from `culture` category pins.
    *   Develop the `StoryMap` feature with historical overlays.

*   **(Continue for all other categories...)**

---

## 5. Phase 4: Groups & Projects

**Objective:** Implement the core collaborative features of the platform.

*   **Task 5.1: Group Management**
    *   Create a "Create Group" form.
    *   Build the `GroupPage` to display group details, members, and associated pins/projects.
    *   Implement "Join/Leave Group" functionality.

*   **Task 5.2: Project Management**
    *   Create a "Launch Project" form, allowing users to link multiple pins.
    *   Develop the `ProjectDashboard` component to show progress, milestones, and funding.

---

## 6. Phase 5: Data & Census Integration

**Objective:** Integrate external data to provide context and insights.

*   **Task 6.1: Census Data Pipeline**
    *   Source UK census data (e.g., from Nomis or the ONS API).
    *   Process the data into GeoJSON or a similar format.
    *   Create a Supabase table to store census data linked to geographic boundaries (LSOA/MSOA).

*   **Task 6.2: Map Overlays**
    *   Create map layers to visualize census data (e.g., population density, deprivation index).
    *   Build a legend and controls to toggle these layers.

*   **Task 6.3: Contextual Data Display**
    *   On pin and project pages, display relevant census data for the area.

---

## 7. Phase 6: Production Polish

**Objective:** Prepare the platform for a live audience.

*   **Task 7.1: Comprehensive Testing**
    *   Write unit tests for critical components and utility functions.
    *   Write integration tests for API endpoints.
    *   Write E2E tests for key user flows (e.g., creating a pin, voting on a proposal).

*   **Task 7.2: Error Handling & Monitoring**
    *   Implement a robust error handling strategy on the frontend and backend.
    *   Integrate a monitoring service (e.g., Sentry, LogRocket).

*   **Task 7.3: Performance Optimization**
    *   Optimize database queries.
    *   Implement image optimization.
    *   Analyze and improve bundle sizes.

*   **Task 7.4: Deployment**
    *   Configure a production-ready deployment pipeline (e.g., using Vercel).
    *   Set up environment variables and secrets management.
