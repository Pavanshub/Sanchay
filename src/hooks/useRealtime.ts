import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtime = (table: string, filter?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    let subscription: RealtimeChannel;

    const setupRealtime = async () => {
      // Initial data fetch
      let query = supabase.from(table).select('*');
      
      if (filter) {
        // Parse filter string like "column=eq.value"
        const [column, operation, value] = filter.split(/[=.]/);
        query = query.filter(column, operation, value);
      }

      const { data: initialData, error } = await query;
      
      if (error) {
        console.error('Error fetching initial data:', error);
      } else {
        setData(initialData || []);
      }
      
      setLoading(false);

      // Setup realtime subscription
      subscription = supabase
        .channel(`realtime-${table}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: table,
            filter: filter 
          }, 
          (payload) => {
            console.log('Realtime update:', payload);
            
            switch (payload.eventType) {
              case 'INSERT':
                setData(prev => [...prev, payload.new]);
                break;
              case 'UPDATE':
                setData(prev => prev.map(item => 
                  item.id === payload.new.id ? payload.new : item
                ));
                break;
              case 'DELETE':
                setData(prev => prev.filter(item => item.id !== payload.old.id));
                break;
            }
          }
        )
        .subscribe();

      setChannel(subscription);
    };

    setupRealtime();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [table, filter]);

  return { data, loading, channel };
};

export const useOrderRealtime = (orderId: string) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from('order_participants')
        .select(`
          *,
          profiles(name)
        `)
        .eq('order_id', orderId);

      if (error) {
        console.error('Error fetching participants:', error);
      } else {
        setParticipants(data || []);
        setTotalAmount(data?.reduce((sum, p) => sum + p.total_amount, 0) || 0);
      }
      
      setLoading(false);
    };

    fetchParticipants();

    // Setup realtime subscription for order participants
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_participants',
          filter: `order_id=eq.${orderId}`
        }, 
        (payload) => {
          console.log('Order participant update:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setParticipants(prev => [...prev, payload.new]);
              setTotalAmount(prev => prev + payload.new.total_amount);
              break;
            case 'UPDATE':
              setParticipants(prev => prev.map(item => 
                item.id === payload.new.id ? payload.new : item
              ));
              // Recalculate total
              fetchParticipants();
              break;
            case 'DELETE':
              setParticipants(prev => prev.filter(item => item.id !== payload.old.id));
              setTotalAmount(prev => prev - payload.old.total_amount);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  return { participants, totalAmount, loading };
};