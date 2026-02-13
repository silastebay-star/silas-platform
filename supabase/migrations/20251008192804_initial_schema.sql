BEGIN;

-- Drop existing tables to ensure a clean run
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.pins CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable PostGIS extension if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- Profiles Table (extending auth.users)
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    role text NOT NULL DEFAULT 'observer',
    verified boolean NOT NULL DEFAULT false,
    metadata jsonb
);

-- Groups Table
CREATE TABLE public.groups (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    public boolean NOT NULL DEFAULT true,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Group Members Table (Many-to-Many)
CREATE TABLE public.group_members (
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member',
    joined_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, profile_id)
);

-- Projects Table
CREATE TABLE public.projects (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    status text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Pins Table
CREATE TABLE public.pins (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    categories text[],
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    geom geometry(Point, 4326), -- Corrected PostGIS type
    status text NOT NULL DEFAULT 'draft',
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Proposals Table
CREATE TABLE public.proposals (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id uuid REFERENCES public.pins(id) ON DELETE CASCADE,
    proposer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action text NOT NULL,
    payload jsonb,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    reviewed_at timestamp with time zone
);

-- Votes Table
CREATE TABLE public.votes (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (proposal_id, voter_id)
);

-- Comments Table
CREATE TABLE public.comments (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id uuid REFERENCES public.pins(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMIT;