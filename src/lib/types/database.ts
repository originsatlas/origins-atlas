// Origins Atlas — Database Types
// These types mirror the hardened Supabase/PostgreSQL schema

export type ThaiProvince =
  | 'Bangkok'
  | 'Samut Prakan'
  | 'Nonthaburi'
  | 'Pathum Thani'
  | 'Chonburi'
  | 'Phuket'
  | 'Chiang Mai'
  | 'Hua Hin'
  | 'Rayong'
  | 'Other';

export type PropertyType =
  | 'detached_house'
  | 'semi_detached'
  | 'townhouse'
  | 'luxury_villa'
  | 'penthouse'
  | 'condo';

export type CommunityType =
  | 'gated_community'
  | 'residential_estate'
  | 'luxury_resort'
  | 'condominium'
  | 'village';

export type HouseStatus =
  | 'active'
  | 'sold'
  | 'unlisted'
  | 'pending_review'
  | 'archived';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  city: string | null;
  province: ThaiProvince | string | null;
  country: string;
  total_units: number | null;
  community_type: CommunityType | string;
  amenities: string[];
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface House {
  id: string;
  community_id: string;
  house_number: string | null;
  address: string | null;
  property_type: PropertyType | string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  house_size_sqm: number | null;
  land_size_sqm: number | null;
  floors: number | null;
  year_built: number | null;
  features: string[];
  description: string | null;
  main_image_url: string | null;
  image_urls: string[];
  status: HouseStatus;
  is_new_listing: boolean;
  has_price_reduction: boolean;
  latitude: number | null;
  longitude: number | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  community?: Community;
  source_listings?: SourceListing[];
  verifications?: Verification[];
}

export interface Agent {
  id: string;
  name: string;
  source_platform: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceListing {
  id: string;
  house_id: string;
  agent_id: string;
  source_url: string | null;
  source_listing_id: string | null;
  asking_price_thb: number | null; // Primary source price
  asking_price_usd: number | null; // Derived USD price
  price_per_sqm_thb: number | null;
  price_per_sqm_usd: number | null;
  listing_date: string | null;
  last_seen_date: string | null;
  is_active: boolean;
  listing_description: string | null;
  listing_images: string[];
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  agent?: Agent;
  house?: House;
  price_history?: PriceHistory[];
}

export interface PriceHistory {
  id: string;
  source_listing_id: string;
  house_id: string;
  price_thb: number; // Primary currency
  price_usd: number; // Derived currency
  price_per_sqm_thb: number | null;
  price_per_sqm_usd: number | null;
  recorded_date: string;
  change_type: 'initial' | 'increase' | 'decrease' | 'no_change';
  change_amount_thb: number | null;
  change_amount_usd: number | null;
  change_percentage: number | null;
  notes: string | null;
  created_at: string;
}

export interface Verification {
  id: string;
  house_id: string;
  verification_status: 'unverified' | 'verified' | 'disputed' | 'pending';
  verification_date: string | null;
  verified_by: string | null;
  verification_method: 'manual' | 'automated' | 'community' | 'agent' | null;
  evidence_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface DuplicateReview {
  id: string;
  house_id_a: string;
  house_id_b: string;
  match_score: number;
  match_reasons: string[];
  status: 'pending' | 'confirmed_duplicate' | 'not_duplicate';
  resolved_by: string | null;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined data
  house_a?: House;
  house_b?: House;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE';
  changed_by: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      communities: {
        Row: Community;
        Insert: Partial<Community> & Pick<Community, 'name' | 'slug'>;
        Update: Partial<Community>;
      };
      houses: {
        Row: House;
        Insert: Partial<House> & Pick<House, 'community_id'>;
        Update: Partial<House>;
      };
      agents: {
        Row: Agent;
        Insert: Partial<Agent> & Pick<Agent, 'name'>;
        Update: Partial<Agent>;
      };
      source_listings: {
        Row: SourceListing;
        Insert: Partial<SourceListing> & Pick<SourceListing, 'house_id' | 'agent_id'>;
        Update: Partial<SourceListing>;
      };
      price_history: {
        Row: PriceHistory;
        Insert: Partial<PriceHistory> & Pick<PriceHistory, 'source_listing_id' | 'house_id' | 'price_thb'>;
        Update: never; // Append-only immutable
      };
      verifications: {
        Row: Verification;
        Insert: Partial<Verification> & Pick<Verification, 'house_id'>;
        Update: Partial<Verification>;
      };
      duplicate_reviews: {
        Row: DuplicateReview;
        Insert: Partial<DuplicateReview> & Pick<DuplicateReview, 'house_id_a' | 'house_id_b'>;
        Update: Partial<DuplicateReview>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog> & Pick<AuditLog, 'table_name' | 'record_id' | 'action'>;
        Update: never;
      };
    };
  };
}

// Helper type for house with all related data
export interface HouseWithDetails extends House {
  community: Community;
  source_listings: (SourceListing & {
    agent: Agent;
    price_history: PriceHistory[];
  })[];
  verifications: Verification[];
}

// Stats type for admin dashboard
export interface DashboardStats {
  totalCommunities: number;
  totalHouses: number;
  totalAgents: number;
  totalListings: number;
  activeListings: number;
  pendingDuplicates: number;
}
