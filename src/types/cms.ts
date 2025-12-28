// CMS Database Types

export interface User {
  id: number;
  email: string;
  password_hash: string | null;
  name: string;
  role: "admin" | "editor";
  invite_token: string | null;
  invite_expires_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  author_id: number;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  // Joined fields
  author_name?: string;
}

export interface Event {
  id: number;
  slug: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
  end_date: string | null;
  end_time: string | null;
  location: string | null;
  image: string | null;
  status: "draft" | "published";
  recurring: "none" | "weekly" | "monthly" | "yearly";
  recurrence_rule: string | null;
  rsvp_link: string | null;
  more_info_link: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
}

export interface PageContent {
  id: number;
  page_key: string;
  content_json: string;
  markdown_body: string | null;
  updated_at: string;
  updated_by: number | null;
}

export interface Member {
  id: number;
  group_type: "vestry" | "music-team" | "endowment" | "clergy";
  name: string;
  title: string;
  term: string | null;
  image: string | null;
  bio: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: number;
  author: string;
  organization: string | null;
  rating: "one" | "two" | "three" | "four" | "five";
  content: string;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Auth types
export interface JWTPayload {
  sub: number;
  email: string;
  name: string;
  role: "admin" | "editor";
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface InviteRequest {
  email: string;
  name: string;
  role: "admin" | "editor";
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}
