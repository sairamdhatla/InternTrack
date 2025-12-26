import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const INACTIVITY_DAYS = 7;

interface JobResult {
  success: boolean;
  message: string;
  retryCount?: number;
}

async function processInterviewReminders(supabase: any): Promise<JobResult> {
  console.log('Processing interview reminders...');
  
  try {
    // Find applications with Interview status that don't have a recent reminder
    const { data: interviewApps, error: fetchError } = await supabase
      .from('applications')
      .select('id, user_id, company, role')
      .eq('status', 'Interview');

    if (fetchError) {
      console.error('Error fetching interview applications:', fetchError);
      return { success: false, message: fetchError.message };
    }

    if (!interviewApps || interviewApps.length === 0) {
      console.log('No interview applications found');
      return { success: true, message: 'No interview applications to process' };
    }

    let notificationsCreated = 0;

    for (const app of interviewApps) {
      // Check if a reminder was already sent in the last 24 hours
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('application_id', app.id)
        .eq('type', 'interview_reminder')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (!existingNotification) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: app.user_id,
            application_id: app.id,
            type: 'interview_reminder',
            message: `Reminder: You have an interview scheduled for ${app.role} at ${app.company}`,
          });

        if (insertError) {
          console.error('Error inserting notification:', insertError);
        } else {
          notificationsCreated++;
        }
      }
    }

    console.log(`Created ${notificationsCreated} interview reminders`);
    return { success: true, message: `Created ${notificationsCreated} interview reminders` };
  } catch (error) {
    console.error('Interview reminder processing error:', error);
    return { success: false, message: String(error) };
  }
}

async function processDeadlineReminders(supabase: any): Promise<JobResult> {
  console.log('Processing deadline reminders...');
  
  try {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find applications with deadlines today or tomorrow where reminder is enabled
    const { data: deadlineApps, error: fetchError } = await supabase
      .from('applications')
      .select('id, user_id, company, role, deadline_date')
      .eq('reminder_enabled', true)
      .in('deadline_date', [todayStr, tomorrowStr]);

    if (fetchError) {
      console.error('Error fetching deadline applications:', fetchError);
      return { success: false, message: fetchError.message };
    }

    if (!deadlineApps || deadlineApps.length === 0) {
      console.log('No deadline applications found');
      return { success: true, message: 'No deadline applications to process' };
    }

    let notificationsCreated = 0;

    for (const app of deadlineApps) {
      const isToday = app.deadline_date === todayStr;
      const notificationType = isToday ? 'deadline_today' : 'deadline_tomorrow';
      
      // Check if a notification was already sent today for this application
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('application_id', app.id)
        .eq('type', notificationType)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (!existingNotification) {
        const message = isToday
          ? `⚠️ Deadline today: ${app.company} – ${app.role}`
          : `⏰ Application deadline tomorrow for ${app.company} – ${app.role}`;

        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: app.user_id,
            application_id: app.id,
            type: notificationType,
            message,
          });

        if (insertError) {
          console.error('Error inserting deadline notification:', insertError);
        } else {
          notificationsCreated++;
        }
      }
    }

    console.log(`Created ${notificationsCreated} deadline reminders`);
    return { success: true, message: `Created ${notificationsCreated} deadline reminders` };
  } catch (error) {
    console.error('Deadline reminder processing error:', error);
    return { success: false, message: String(error) };
  }
}

async function processFollowUpReminders(supabase: any): Promise<JobResult> {
  console.log('Processing follow-up reminders...');
  
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find follow-ups with next_follow_up_date = today
    const { data: followUps, error: fetchError } = await supabase
      .from('follow_ups')
      .select('id, user_id, application_id, next_follow_up_date')
      .eq('next_follow_up_date', today);

    if (fetchError) {
      console.error('Error fetching follow-ups:', fetchError);
      return { success: false, message: fetchError.message };
    }

    if (!followUps || followUps.length === 0) {
      console.log('No follow-up reminders found');
      return { success: true, message: 'No follow-up reminders to process' };
    }

    let notificationsCreated = 0;

    for (const followUp of followUps) {
      // Get application details
      const { data: app } = await supabase
        .from('applications')
        .select('company, role')
        .eq('id', followUp.application_id)
        .single();

      if (!app) continue;

      // Check if a notification was already sent today for this follow-up
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('application_id', followUp.application_id)
        .eq('type', 'follow_up_due')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (!existingNotification) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: followUp.user_id,
            application_id: followUp.application_id,
            type: 'follow_up_due',
            message: `🔁 Follow-up due for ${app.company} – ${app.role}`,
          });

        if (insertError) {
          console.error('Error inserting follow-up notification:', insertError);
        } else {
          notificationsCreated++;
        }
      }
    }

    console.log(`Created ${notificationsCreated} follow-up reminders`);
    return { success: true, message: `Created ${notificationsCreated} follow-up reminders` };
  } catch (error) {
    console.error('Follow-up reminder processing error:', error);
    return { success: false, message: String(error) };
  }
}

async function processWeeklySummaryNotifications(supabase: any): Promise<JobResult> {
  console.log('Processing weekly summary notifications...');
  
  try {
    // Only run on Sundays (day 0) to create weekly summary
    const today = new Date();
    if (today.getDay() !== 0) {
      console.log('Not Sunday, skipping weekly summary');
      return { success: true, message: 'Skipped - not Sunday' };
    }

    // Get all unique users who have applications
    const { data: users, error: usersError } = await supabase
      .from('applications')
      .select('user_id')
      .limit(1000);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { success: false, message: usersError.message };
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(users?.map((u: any) => u.user_id) || [])];

    if (uniqueUserIds.length === 0) {
      console.log('No users found');
      return { success: true, message: 'No users to notify' };
    }

    let notificationsCreated = 0;

    for (const userId of uniqueUserIds) {
      // Check if a weekly summary was already sent this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'weekly_summary')
        .gte('created_at', weekStart.toISOString())
        .maybeSingle();

      if (!existingNotification) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            application_id: null,
            type: 'weekly_summary',
            message: '📊 Your weekly progress summary is ready',
          });

        if (insertError) {
          console.error('Error inserting weekly summary notification:', insertError);
        } else {
          notificationsCreated++;
        }
      }
    }

    console.log(`Created ${notificationsCreated} weekly summary notifications`);
    return { success: true, message: `Created ${notificationsCreated} weekly summary notifications` };
  } catch (error) {
    console.error('Weekly summary notification processing error:', error);
    return { success: false, message: String(error) };
  }
}

async function processInactivityAlerts(supabase: any): Promise<JobResult> {
  console.log('Processing inactivity alerts...');
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS);

    // Find applications with no status change in X days
    const { data: inactiveApps, error: fetchError } = await supabase
      .from('applications')
      .select('id, user_id, company, role, updated_at')
      .lt('updated_at', cutoffDate.toISOString())
      .not('status', 'in', '("Rejected","Offer Accepted","Offer Declined","Withdrawn")');

    if (fetchError) {
      console.error('Error fetching inactive applications:', fetchError);
      return { success: false, message: fetchError.message };
    }

    if (!inactiveApps || inactiveApps.length === 0) {
      console.log('No inactive applications found');
      return { success: true, message: 'No inactive applications to process' };
    }

    let notificationsCreated = 0;

    for (const app of inactiveApps) {
      // Check if an inactivity alert was already sent in the last 7 days
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('application_id', app.id)
        .eq('type', 'inactivity_alert')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (!existingNotification) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: app.user_id,
            application_id: app.id,
            type: 'inactivity_alert',
            message: `No updates for ${INACTIVITY_DAYS} days on your ${app.role} application at ${app.company}`,
          });

        if (insertError) {
          console.error('Error inserting notification:', insertError);
        } else {
          notificationsCreated++;
        }
      }
    }

    console.log(`Created ${notificationsCreated} inactivity alerts`);
    return { success: true, message: `Created ${notificationsCreated} inactivity alerts` };
  } catch (error) {
    console.error('Inactivity alert processing error:', error);
    return { success: false, message: String(error) };
  }
}

async function runWithRetry(
  fn: (supabase: any) => Promise<JobResult>,
  supabase: any,
  jobName: string
): Promise<JobResult> {
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`${jobName}: Attempt ${attempt}/${MAX_RETRIES}`);
    
    const result = await fn(supabase);
    
    if (result.success) {
      return { ...result, retryCount: attempt };
    }
    
    lastError = result.message;
    console.log(`${jobName}: Failed attempt ${attempt}, ${MAX_RETRIES - attempt} retries remaining`);
    
    if (attempt < MAX_RETRIES) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  return { success: false, message: `Failed after ${MAX_RETRIES} attempts: ${lastError}`, retryCount: MAX_RETRIES };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting notification processing jobs...');

    // Run all jobs
    const [interviewResult, deadlineResult, followUpResult, weeklySummaryResult, inactivityResult] = await Promise.all([
      runWithRetry(processInterviewReminders, supabase, 'InterviewReminders'),
      runWithRetry(processDeadlineReminders, supabase, 'DeadlineReminders'),
      runWithRetry(processFollowUpReminders, supabase, 'FollowUpReminders'),
      runWithRetry(processWeeklySummaryNotifications, supabase, 'WeeklySummary'),
      runWithRetry(processInactivityAlerts, supabase, 'InactivityAlerts'),
    ]);

    const response = {
      timestamp: new Date().toISOString(),
      jobs: {
        interviewReminders: interviewResult,
        deadlineReminders: deadlineResult,
        followUpReminders: followUpResult,
        weeklySummary: weeklySummaryResult,
        inactivityAlerts: inactivityResult,
      },
    };

    console.log('Notification processing complete:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-notifications:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
