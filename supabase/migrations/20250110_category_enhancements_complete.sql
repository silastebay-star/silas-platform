-- Category-Specific Enhancements Migration
-- Adds specialized tables and functionality for Environment, Infrastructure, and Housing categories

BEGIN;

-- ============================================================================
-- ENVIRONMENT CATEGORY ENHANCEMENTS
-- ============================================================================

-- Environmental metrics tracking
CREATE TABLE IF NOT EXISTS public.environmental_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id text NOT NULL,
  name text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  target_value numeric,
  trend text CHECK (trend IN ('improving', 'declining', 'stable')),
  category text CHECK (category IN ('air', 'water', 'energy', 'waste', 'biodiversity', 'carbon')),
  location geometry(Point, 4326),
  source text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Green initiatives
CREATE TABLE IF NOT EXISTS public.green_initiatives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text CHECK (category IN ('renewable_energy', 'waste_reduction', 'conservation', 'transportation', 'education')),
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'paused')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_date date,
  budget numeric DEFAULT 0,
  participants_count integer DEFAULT 0,
  impact_metrics jsonb DEFAULT '{}',
  location geometry(Point, 4326),
  pin_id uuid REFERENCES public.pins(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Initiative participants
CREATE TABLE IF NOT EXISTS public.initiative_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id uuid NOT NULL REFERENCES public.green_initiatives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'participant' CHECK (role IN ('organizer', 'volunteer', 'participant')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(initiative_id, user_id)
);

-- Sustainability goals
CREATE TABLE IF NOT EXISTS public.sustainability_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text NOT NULL,
  deadline date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text NOT NULL,
  milestones jsonb DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Environmental data cache
CREATE TABLE IF NOT EXISTS public.environmental_data_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  location geometry(Point, 4326),
  created_at timestamptz DEFAULT now()
);

-- Environmental data requests log
CREATE TABLE IF NOT EXISTS public.environmental_data_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location geometry(Point, 4326),
  category text,
  timeframe text,
  metrics_count integer,
  requested_at timestamptz DEFAULT now()
);

-- Environmental data submissions
CREATE TABLE IF NOT EXISTS public.environmental_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_id text NOT NULL,
  value numeric NOT NULL,
  location geometry(Point, 4326),
  source text,
  notes text,
  status text DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INFRASTRUCTURE CATEGORY ENHANCEMENTS
-- ============================================================================

-- Infrastructure assets
CREATE TABLE IF NOT EXISTS public.infrastructure_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text CHECK (type IN ('road', 'bridge', 'water', 'sewer', 'electrical', 'telecommunications', 'building')),
  status text CHECK (status IN ('excellent', 'good', 'fair', 'poor', 'critical')),
  condition_score integer CHECK (condition_score >= 0 AND condition_score <= 100),
  last_inspection date,
  next_maintenance date,
  estimated_cost numeric DEFAULT 0,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  location geometry(Point, 4326) NOT NULL,
  address text,
  specifications jsonb DEFAULT '{}',
  pin_id uuid REFERENCES public.pins(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Maintenance records
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id uuid NOT NULL REFERENCES public.infrastructure_assets(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text CHECK (type IN ('inspection', 'repair', 'replacement', 'upgrade')),
  description text NOT NULL,
  cost numeric DEFAULT 0,
  contractor text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  photos text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Infrastructure projects
CREATE TABLE IF NOT EXISTS public.infrastructure_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('new_construction', 'major_repair', 'upgrade', 'replacement')),
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'design', 'permitting', 'construction', 'completed')),
  budget numeric DEFAULT 0,
  spent numeric DEFAULT 0,
  start_date date,
  completion_date date,
  contractor text,
  affected_assets uuid[] DEFAULT '{}',
  milestones jsonb DEFAULT '[]',
  pin_id uuid REFERENCES public.pins(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Infrastructure issue reports
CREATE TABLE IF NOT EXISTS public.infrastructure_issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  location geometry(Point, 4326) NOT NULL,
  address text,
  photos text[] DEFAULT '{}',
  asset_id uuid REFERENCES public.infrastructure_assets(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- ============================================================================
-- HOUSING CATEGORY ENHANCEMENTS
-- ============================================================================

-- Housing market data
CREATE TABLE IF NOT EXISTS public.housing_market_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  area_name text NOT NULL,
  area_boundary geometry(Polygon, 4326),
  median_price numeric,
  price_change_1y numeric,
  price_change_3m numeric,
  average_rent numeric,
  rent_change_1y numeric,
  affordability_index numeric,
  inventory_count integer,
  days_on_market integer,
  price_per_sqft numeric,
  data_source text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Development projects
CREATE TABLE IF NOT EXISTS public.development_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text CHECK (type IN ('residential', 'commercial', 'mixed_use', 'affordable_housing')),
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'under_construction', 'completed')),
  units integer DEFAULT 0,
  affordable_units integer DEFAULT 0,
  developer text,
  estimated_completion date,
  budget numeric DEFAULT 0,
  location geometry(Point, 4326) NOT NULL,
  address text,
  community_impact jsonb DEFAULT '{}',
  pin_id uuid REFERENCES public.pins(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Housing policies
CREATE TABLE IF NOT EXISTS public.housing_policies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  type text CHECK (type IN ('zoning', 'affordability', 'development', 'rent_control', 'tax_incentive')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'implemented')),
  effective_date date,
  impact_area text,
  expected_outcomes text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Affordability calculations cache
CREATE TABLE IF NOT EXISTS public.affordability_calculations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  income numeric NOT NULL,
  area_id text,
  median_home_price numeric,
  affordability_ratio numeric,
  recommended_income numeric,
  monthly_payment numeric,
  down_payment_needed numeric,
  affordable_price_range jsonb,
  calculated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CENSUS DATA INTEGRATION TABLES
-- ============================================================================

-- Census data cache
CREATE TABLE IF NOT EXISTS public.census_data_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bbox text NOT NULL,
  level text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Census data requests log
CREATE TABLE IF NOT EXISTS public.census_data_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bbox text NOT NULL,
  level text,
  fields text,
  result_count integer,
  requested_at timestamptz DEFAULT now()
);

-- Census aggregation requests
CREATE TABLE IF NOT EXISTS public.census_aggregation_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bbox text NOT NULL,
  level text,
  metrics text[] DEFAULT '{}',
  aggregation_type text,
  group_by text,
  filters jsonb,
  result_count integer,
  requested_at timestamptz DEFAULT now()
);

-- Census comparison requests
CREATE TABLE IF NOT EXISTS public.census_comparison_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  areas jsonb NOT NULL,
  metrics text[] DEFAULT '{}',
  level text,
  comparison_type text,
  result_summary jsonb,
  requested_at timestamptz DEFAULT now()
);

-- Census analysis results
CREATE TABLE IF NOT EXISTS public.census_analysis_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bbox text NOT NULL,
  level text,
  analysis_type text NOT NULL,
  parameters jsonb,
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Environmental indexes
CREATE INDEX IF NOT EXISTS idx_environmental_metrics_location ON public.environmental_metrics USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_environmental_metrics_category ON public.environmental_metrics (category);
CREATE INDEX IF NOT EXISTS idx_green_initiatives_status ON public.green_initiatives (status);
CREATE INDEX IF NOT EXISTS idx_green_initiatives_location ON public.green_initiatives USING GIST (location);

-- Infrastructure indexes
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_location ON public.infrastructure_assets USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_type ON public.infrastructure_assets (type);
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_status ON public.infrastructure_assets (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_asset_id ON public.maintenance_records (asset_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_issues_location ON public.infrastructure_issues USING GIST (location);

-- Housing indexes
CREATE INDEX IF NOT EXISTS idx_housing_market_data_area ON public.housing_market_data (area_name);
CREATE INDEX IF NOT EXISTS idx_development_projects_location ON public.development_projects USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_development_projects_status ON public.development_projects (status);

-- Census indexes
CREATE INDEX IF NOT EXISTS idx_census_data_cache_bbox ON public.census_data_cache (bbox);
CREATE INDEX IF NOT EXISTS idx_census_data_requests_bbox ON public.census_data_requests (bbox);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.environmental_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.census_data_cache ENABLE ROW LEVEL SECURITY;

-- Environmental policies
CREATE POLICY "Environmental metrics are viewable by everyone" ON public.environmental_metrics
  FOR SELECT USING (true);

CREATE POLICY "Green initiatives are viewable by everyone" ON public.green_initiatives
  FOR SELECT USING (true);

CREATE POLICY "Users can create green initiatives" ON public.green_initiatives
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own green initiatives" ON public.green_initiatives
  FOR UPDATE USING (auth.uid() = created_by);

-- Infrastructure policies
CREATE POLICY "Infrastructure assets are viewable by everyone" ON public.infrastructure_assets
  FOR SELECT USING (true);

CREATE POLICY "Infrastructure issues are viewable by everyone" ON public.infrastructure_issues
  FOR SELECT USING (true);

CREATE POLICY "Users can report infrastructure issues" ON public.infrastructure_issues
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Housing policies
CREATE POLICY "Housing market data is viewable by everyone" ON public.housing_market_data
  FOR SELECT USING (true);

CREATE POLICY "Development projects are viewable by everyone" ON public.development_projects
  FOR SELECT USING (true);

CREATE POLICY "Housing policies are viewable by everyone" ON public.housing_policies
  FOR SELECT USING (true);

-- Census policies
CREATE POLICY "Census data cache is viewable by everyone" ON public.census_data_cache
  FOR SELECT USING (true);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample environmental metrics
INSERT INTO public.environmental_metrics (metric_id, name, value, unit, target_value, trend, category, source) VALUES
('air-quality-index', 'Air Quality Index', 42, 'AQI', 50, 'improving', 'air', 'Local Air Quality Monitor'),
('pm25-concentration', 'PM2.5 Concentration', 12, 'μg/m³', 15, 'stable', 'air', 'Environmental Sensor Network'),
('water-quality', 'Water Quality Index', 85, 'WQI', 80, 'improving', 'water', 'Water Treatment Plant'),
('renewable-energy', 'Renewable Energy Usage', 67, '%', 80, 'improving', 'energy', 'Energy Grid Monitor'),
('waste-diversion', 'Waste Diversion Rate', 89, '%', 85, 'improving', 'waste', 'Waste Management System'),
('carbon-emissions', 'Carbon Emissions', 8.5, 'tCO₂e/capita', 6, 'declining', 'carbon', 'Carbon Tracking System')
ON CONFLICT DO NOTHING;

-- Insert sample housing market data
INSERT INTO public.housing_market_data (area_name, median_price, price_change_1y, average_rent, rent_change_1y, affordability_index, inventory_count, days_on_market, price_per_sqft) VALUES
('City Centre', 450000, 5.2, 1800, 3.1, 85, 45, 28, 320),
('Residential District', 320000, 3.8, 1400, 2.5, 110, 78, 35, 280),
('Suburban Area', 280000, 2.1, 1200, 1.8, 125, 92, 42, 250)
ON CONFLICT DO NOTHING;

COMMIT;
