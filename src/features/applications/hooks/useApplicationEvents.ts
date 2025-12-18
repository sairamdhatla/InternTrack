import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApplicationEvent {
  id: string;
  application_id: string;
  user_id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
}

export function useApplicationEvents(applicationId?: string) {
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    
    let query = supabase
      .from('application_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [applicationId]);

  return { events, loading, refresh: fetchEvents };
}
