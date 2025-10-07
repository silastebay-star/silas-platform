import { supabase } from '@/core/lib/supabase';
import type { Pin, PinFilters, PinFormData, CreatePinRequest, UpdatePinRequest, PinSearchResult } from '../types/pin.types';

export class PinsApi {
  /**
   * Get pins with optional filtering
   */
  static async getPins(filters: PinFilters = {}): Promise<Pin[]> {
    let query = supabase
      .from('pins')
      .select(`
        *,
        categories(id, name, slug, color, icon),
        user_profiles!pins_created_by_fkey(id, display_name, avatar_url)
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.subcategory) {
      query = query.eq('subcategory', filters.subcategory);
    }

    if (filters.pin_type) {
      query = query.eq('pin_type', filters.pin_type);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.fund_eligible !== undefined) {
      query = query.eq('fund_eligible', filters.fund_eligible);
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Spatial filtering
    if (filters.bounds) {
      const { north, south, east, west } = filters.bounds;
      query = query.filter(
        'geom',
        'st_within',
        `POLYGON((${west} ${south}, ${east} ${south}, ${east} ${north}, ${west} ${north}, ${west} ${south}))`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single pin by ID
   */
  static async getPin(id: string): Promise<Pin | null> {
    const { data, error } = await supabase
      .from('pins')
      .select(`
        *,
        categories(id, name, slug, color, icon),
        user_profiles!pins_created_by_fkey(id, display_name, avatar_url, role, is_verified)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new pin
   */
  static async createPin(request: CreatePinRequest): Promise<Pin> {
    const { pin_data, photos } = request;

    // Upload photos first if provided
    let uploadedPhotos: any[] = [];
    if (photos && photos.length > 0) {
      uploadedPhotos = await this.uploadPhotos(photos);
    }

    // Create pin with PostGIS geometry
    const pinToCreate = {
      ...pin_data,
      geom: `POINT(${pin_data.coordinates.longitude} ${pin_data.coordinates.latitude})`,
      photos: uploadedPhotos,
      created_by: (await supabase.auth.getUser()).data.user?.id
    };

    const { data, error } = await supabase
      .from('pins')
      .insert([pinToCreate])
      .select(`
        *,
        categories(id, name, slug, color, icon),
        user_profiles!pins_created_by_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing pin
   */
  static async updatePin(request: UpdatePinRequest): Promise<Pin> {
    const { id, updates, photos } = request;

    // Upload new photos if provided
    let uploadedPhotos: any[] = [];
    if (photos && photos.length > 0) {
      uploadedPhotos = await this.uploadPhotos(photos);
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Update geometry if coordinates changed
    if (updates.coordinates) {
      updateData.geom = `POINT(${updates.coordinates.longitude} ${updates.coordinates.latitude})`;
    }

    // Append new photos to existing ones
    if (uploadedPhotos.length > 0) {
      const existingPin = await this.getPin(id);
      updateData.photos = [...(existingPin?.photos || []), ...uploadedPhotos];
    }

    const { data, error } = await supabase
      .from('pins')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        categories(id, name, slug, color, icon),
        user_profiles!pins_created_by_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a pin
   */
  static async deletePin(id: string): Promise<void> {
    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Upload photos to Supabase storage
   */
  private static async uploadPhotos(files: File[]): Promise<any[]> {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pins/${fileName}`;

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return {
        id: fileName,
        url: publicUrl,
        caption: '',
        alt_text: file.name
      };
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Get pins near a location
   */
  static async getPinsNearLocation(
    coordinates: { latitude: number; longitude: number },
    radiusKm: number = 5
  ): Promise<Pin[]> {
    const { data, error } = await supabase
      .rpc('get_pins_near_location', {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        radius_km: radiusKm
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Search pins with full-text search
   */
  static async searchPins(query: string, filters: PinFilters = {}): Promise<PinSearchResult> {
    const pins = await this.getPins({
      ...filters,
      search: query
    });

    // TODO: Implement clustering logic
    const clusters = [];

    return {
      pins,
      total_count: pins.length,
      clusters
    };
  }

  /**
   * Subscribe to pin changes in real-time
   */
  static subscribeToPins(
    callback: (payload: any) => void,
    filters: PinFilters = {}
  ) {
    let channel = supabase
      .channel('pins-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pins'
      }, callback);

    // Apply filters to subscription if needed
    if (filters.category_id) {
      channel = channel.filter('category_id', 'eq', filters.category_id);
    }

    return channel.subscribe();
  }
}
