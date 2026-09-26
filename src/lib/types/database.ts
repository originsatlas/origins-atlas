// Origins Atlas — Database Types
// These types mirror the Supabase/PostgreSQL schema

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  city: string | null;
  province: string | null;
  country: string;
  total_units: number | null;
  community_type: string;
  amenities: string[];
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface House {
  id: string;
  community_id: string;
  house_number: string | null;
  address: string | null;
  property_type: string;
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
  status: 'active' | 'sold' | 'unlisted' | 'pending_review';
  is_new_listing: boolean;
  has_price_reduction: boolean;
  latitude: number | null;
  longitude: number | null;
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
  created_at: string;
  updated_at: string;
}

export interface SourceListing {
  id: string;
  house_id: string;
  agent_id: string;
  source_url: string | null;
  source_listing_id: string | null;
  asking_price_usd: number | null;
  asking_price_thb: number | null;
  price_per_sqm_usd: number | null;
  listing_date: string | null;
  last_seen_date: string | null;
  is_active: boolean;
  listing_description: string | null;
  listing_images: string[];
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
  price_usd: number;
  price_thb: number | null;
  price_per_sqm_usd: number | null;
  recorded_date: string;
  change_type: 'initial' | 'increase' | 'decrease' | 'no_change';
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
        Insert: Partial<PriceHistory> & Pick<PriceHistory, 'source_listing_id' | 'house_id' | 'price_usd'>;
        Update: Partial<PriceHistory>;
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
