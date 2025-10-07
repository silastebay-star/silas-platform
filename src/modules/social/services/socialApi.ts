import { supabase } from '@/core/lib/supabase';
import type { 
  Comment, 
  Reaction, 
  Share, 
  SocialFeed,
  CreateCommentRequest,
  UpdateCommentRequest,
  AddReactionRequest,
  CreateShareRequest,
  SocialFilters 
} from '../types/social.types';

export class SocialApi {
  /**
   * Comments API
   */
  static async getComments(pinId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('pin_comments')
      .select(`
        *,
        user_profiles!pin_comments_user_id_fkey(id, display_name, avatar_url, role)
      `)
      .eq('pin_id', pinId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const replies = await this.getCommentReplies(comment.id);
        return { ...comment, replies };
      })
    );

    return commentsWithReplies;
  }

  static async getCommentReplies(parentId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('pin_comments')
      .select(`
        *,
        user_profiles!pin_comments_user_id_fkey(id, display_name, avatar_url, role)
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createComment(request: CreateCommentRequest): Promise<Comment> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('pin_comments')
      .insert([{
        ...request,
        user_id: user.data.user.id
      }])
      .select(`
        *,
        user_profiles!pin_comments_user_id_fkey(id, display_name, avatar_url, role)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateComment(request: UpdateCommentRequest): Promise<Comment> {
    const { data, error } = await supabase
      .from('pin_comments')
      .update({
        content: request.content,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id)
      .select(`
        *,
        user_profiles!pin_comments_user_id_fkey(id, display_name, avatar_url, role)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('pin_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Reactions API
   */
  static async getReactions(pinId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('pin_reactions')
      .select('reaction_type')
      .eq('pin_id', pinId);

    if (error) throw error;

    // Count reactions by type
    const reactionCounts = (data || []).reduce((acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return reactionCounts;
  }

  static async getUserReaction(pinId: string): Promise<Reaction | null> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;

    const { data, error } = await supabase
      .from('pin_reactions')
      .select('*')
      .eq('pin_id', pinId)
      .eq('user_id', user.data.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async addReaction(request: AddReactionRequest): Promise<Reaction> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Remove existing reaction first
    await this.removeReaction(request.pin_id);

    const { data, error } = await supabase
      .from('pin_reactions')
      .insert([{
        ...request,
        user_id: user.data.user.id
      }])
      .select(`
        *,
        user_profiles!pin_reactions_user_id_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async removeReaction(pinId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('pin_reactions')
      .delete()
      .eq('pin_id', pinId)
      .eq('user_id', user.data.user.id);

    if (error) throw error;
  }

  /**
   * Shares API
   */
  static async createShare(request: CreateShareRequest): Promise<Share> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('pin_shares')
      .insert([{
        ...request,
        user_id: user.data.user.id
      }])
      .select(`
        *,
        user_profiles!pin_shares_user_id_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getShareCount(pinId: string): Promise<number> {
    const { count, error } = await supabase
      .from('pin_shares')
      .select('*', { count: 'exact', head: true })
      .eq('pin_id', pinId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Social Feed API
   */
  static async getSocialFeed(filters: SocialFilters = {}): Promise<SocialFeed[]> {
    // This would be implemented with a view or function that aggregates
    // social activities across pins, comments, reactions, etc.
    const { data, error } = await supabase
      .rpc('get_social_feed', {
        pin_id_filter: filters.pin_id,
        user_id_filter: filters.user_id,
        date_from_filter: filters.date_from,
        date_to_filter: filters.date_to
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Real-time subscriptions
   */
  static subscribeToComments(pinId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`pin-comments-${pinId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pin_comments',
        filter: `pin_id=eq.${pinId}`
      }, callback)
      .subscribe();
  }

  static subscribeToReactions(pinId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`pin-reactions-${pinId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pin_reactions',
        filter: `pin_id=eq.${pinId}`
      }, callback)
      .subscribe();
  }
}
