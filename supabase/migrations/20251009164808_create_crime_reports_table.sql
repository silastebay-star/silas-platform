BEGIN;

CREATE TABLE public.crime_reports (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    type text NOT NULL,
    location text NOT NULL,
    reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'reported',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMIT;
