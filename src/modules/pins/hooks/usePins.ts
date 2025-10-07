import { useState, useEffect, useCallback } from 'react';
import { PinsApi } from '../services/pinsApi';
import type { Pin, PinFilters } from '../types/pin.types';
import type { AsyncState } from '@/core/types/common';

export interface UsePinsReturn extends AsyncState<Pin[]> {
  pins: Pin[];
  refetch: () => Promise<void>;
  createPin: (pinData: any) => Promise<Pin>;
  updatePin: (id: string, updates: any) => Promise<Pin>;
  deletePin: (id: string) => Promise<void>;
}

export const usePins = (filters: PinFilters = {}): UsePinsReturn => {
  const [state, setState] = useState<AsyncState<Pin[]>>({
    data: [],
    loading: 'idle',
    error: null
  });

  const fetchPins = useCallback(async () => {
    setState(prev => ({ ...prev, loading: 'loading', error: null }));
    
    try {
      const pins = await PinsApi.getPins(filters);
      setState({
        data: pins,
        loading: 'success',
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch pins'
      }));
    }
  }, [filters]);

  const createPin = useCallback(async (pinData: any): Promise<Pin> => {
    const pin = await PinsApi.createPin(pinData);
    setState(prev => ({
      ...prev,
      data: prev.data ? [pin, ...prev.data] : [pin]
    }));
    return pin;
  }, []);

  const updatePin = useCallback(async (id: string, updates: any): Promise<Pin> => {
    const updatedPin = await PinsApi.updatePin({ id, updates });
    setState(prev => ({
      ...prev,
      data: prev.data?.map(pin => pin.id === id ? updatedPin : pin) || []
    }));
    return updatedPin;
  }, []);

  const deletePin = useCallback(async (id: string): Promise<void> => {
    await PinsApi.deletePin(id);
    setState(prev => ({
      ...prev,
      data: prev.data?.filter(pin => pin.id !== id) || []
    }));
  }, []);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = PinsApi.subscribeToPins((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      setState(prev => {
        if (!prev.data) return prev;
        
        switch (eventType) {
          case 'INSERT':
            return {
              ...prev,
              data: [newRecord, ...prev.data]
            };
          case 'UPDATE':
            return {
              ...prev,
              data: prev.data.map(pin => pin.id === newRecord.id ? newRecord : pin)
            };
          case 'DELETE':
            return {
              ...prev,
              data: prev.data.filter(pin => pin.id !== oldRecord.id)
            };
          default:
            return prev;
        }
      });
    }, filters);

    return () => {
      subscription.unsubscribe();
    };
  }, [filters]);

  return {
    ...state,
    pins: state.data || [],
    refetch: fetchPins,
    createPin,
    updatePin,
    deletePin
  };
};
