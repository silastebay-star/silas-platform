import type { BaseEntity, UserProfile } from '@/core/types/common';

export interface Reaction extends BaseEntity {
  pin_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'support' | 'pray' | 'celebrate' | 'concern';
  user?: UserProfile;
}

export interface Comment extends BaseEntity {
  pin_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  is_edited: boolean;
  is_flagged: boolean;
  user?: UserProfile;
  replies?: Comment[];
  reaction_counts?: Record<string, number>;
}

export interface Share extends BaseEntity {
  pin_id: string;
  user_id: string;
  share_type: 'link' | 'social' | 'email';
  user?: UserProfile;
}

export interface SocialFeed {
  id: string;
  type: 'pin_created' | 'pin_updated' | 'comment_added' | 'reaction_added';
  pin_id: string;
  user_id: string;
  content?: string;
  metadata?: Record<string, any>;
  created_at: string;
  user?: UserProfile;
  pin?: {
    id: string;
    name: string;
    category?: {
      name: string;
      color: string;
    };
  };
}

export interface SocialStats {
  total_reactions: number;
  total_comments: number;
  total_shares: number;
  reactions_by_type: Record<string, number>;
  top_contributors: UserProfile[];
  recent_activity: SocialFeed[];
}

export interface CreateCommentRequest {
  pin_id: string;
  content: string;
  parent_id?: string;
}

export interface UpdateCommentRequest {
  id: string;
  content: string;
}

export interface AddReactionRequest {
  pin_id: string;
  reaction_type: Reaction['reaction_type'];
}

export interface CreateShareRequest {
  pin_id: string;
  share_type: Share['share_type'];
}

export interface SocialFilters {
  pin_id?: string;
  user_id?: string;
  reaction_type?: Reaction['reaction_type'];
  date_from?: string;
  date_to?: string;
}
