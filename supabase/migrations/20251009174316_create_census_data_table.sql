BEGIN;

CREATE TABLE public.census_data (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text NOT NULL UNIQUE,
    geom geometry(MultiPolygon, 4326),
    population integer,
    avg_income numeric,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMIT;
