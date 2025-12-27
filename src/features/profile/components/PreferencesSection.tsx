import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, Lightbulb, Bell, TrendingUp, Loader2 } from 'lucide-react';
import { useUserPreferences, UserPreferences } from '../hooks/useUserPreferences';

interface PreferencesSectionProps {
  userId: string;
}

export function PreferencesSection({ userId }: PreferencesSectionProps) {
  const { preferences, loading, updatePreference } = useUserPreferences(userId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return null;
  }

  type PreferenceKey = 'smart_suggestions_enabled' | 'follow_up_suggestions_enabled' | 
    'insight_suggestions_enabled' | 'career_insights_enabled' | 'interview_reminders_enabled' | 
    'deadline_reminders_enabled' | 'inactivity_alerts_enabled';

  const handleToggle = (key: PreferenceKey, value: boolean) => {
    updatePreference(key, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Dashboard Preferences
        </CardTitle>
        <CardDescription>
          Control what features and insights appear on your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Intelligence Features */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            Intelligence Features
          </div>

          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Smart Suggestions</Label>
                <p className="text-xs text-muted-foreground">
                  Show actionable suggestions based on your applications
                </p>
              </div>
              <Switch
                checked={preferences.smart_suggestions_enabled}
                onCheckedChange={(checked) => handleToggle('smart_suggestions_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Follow-up Suggestions</Label>
                <p className="text-xs text-muted-foreground">
                  Get reminders to follow up on pending applications
                </p>
              </div>
              <Switch
                checked={preferences.follow_up_suggestions_enabled}
                onCheckedChange={(checked) => handleToggle('follow_up_suggestions_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Insight Suggestions</Label>
                <p className="text-xs text-muted-foreground">
                  Show platform and role-based insights in suggestions
                </p>
              </div>
              <Switch
                checked={preferences.insight_suggestions_enabled}
                onCheckedChange={(checked) => handleToggle('insight_suggestions_enabled', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Career Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Career Insights
          </div>

          <div className="pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Career Insights Panel</Label>
                <p className="text-xs text-muted-foreground">
                  Show pattern analysis and career intelligence
                </p>
              </div>
              <Switch
                checked={preferences.career_insights_enabled}
                onCheckedChange={(checked) => handleToggle('career_insights_enabled', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Bell className="h-4 w-4" />
            Notification Preferences
          </div>

          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Interview Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about upcoming interviews
                </p>
              </div>
              <Switch
                checked={preferences.interview_reminders_enabled}
                onCheckedChange={(checked) => handleToggle('interview_reminders_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Deadline Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about application deadlines
                </p>
              </div>
              <Switch
                checked={preferences.deadline_reminders_enabled}
                onCheckedChange={(checked) => handleToggle('deadline_reminders_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Inactivity Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Alert when applications have no updates
                </p>
              </div>
              <Switch
                checked={preferences.inactivity_alerts_enabled}
                onCheckedChange={(checked) => handleToggle('inactivity_alerts_enabled', checked)}
              />
            </div>

            {preferences.inactivity_alerts_enabled && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Inactivity Threshold</Label>
                  <p className="text-xs text-muted-foreground">
                    Days before an inactivity alert
                  </p>
                </div>
                <Select
                  value={String(preferences.inactivity_alert_days)}
                  onValueChange={(value) => updatePreference('inactivity_alert_days', parseInt(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
