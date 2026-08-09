// D1 Database type definitions for CuratedLux

export interface InventoryItem {
  id: string;
  owner_id: string;
  category: string;
  brand: string;
  model: string;
  reference_number: string;
  year: number | null;
  condition_grade: number;
  condition_label: string;
  estimated_value: number;
  currency: string;
  confidence: number;
  authenticity_status: string;
  reasoning: string;
  confidence_logo: number;
  confidence_serial: number;
  confidence_materials: number;
  confidence_bezel: number;
  inclusions: string;
  image_data: string;
  image_count: number;
  status: string;
  escrow_amount: number;
  created_at: string;
  updated_at: string;
}

export interface ClientRequest {
  id: string;
  owner_id: string;
  client_name: string;
  looking_for_brand: string;
  looking_for_model: string;
  reference_number: string;
  budget_usd: number;
  currency: string;
  urgency: string;
  condition_required: number;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  inventory_id: string;
  request_id: string;
  brand_score: number;
  model_score: number;
  price_score: number;
  condition_score: number;
  overall_score: number;
  match_status: string;
  created_at: string;
}

export interface Dossier {
  id: string;
  inventory_id: string;
  owner_id: string;
  appraiser_name: string;
  appraiser_signature: string;
  qr_verification_code: string;
  device_hash: string;
  notes: string;
  export_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  company_name: string;
  role: string;
  tier: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface ValuationResult {
  category: string;
  brand: string;
  model: string;
  referenceNumber: string;
  estimatedValue: number;
  currency: string;
  confidence: number;
  authenticityStatus: string;
  reasoning: string;
  confidence_breakdown: {
    logo: number;
    serial: number;
    materials: number;
    bezel_geometry: number;
  };
}
