export interface SchoolProfile {
  id: string;
  school_name: string;
  tagline: string | null;
  description: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  vision: string | null;
  mission: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolProfileFormData {
  school_name: string;
  tagline?: string;
  description?: string;
  logo?: File | null;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  vision?: string;
  mission?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

export interface SchoolProfileResponse {
  success: boolean;
  message: string;
  data: {
    school_profile: SchoolProfile;
  };
}
