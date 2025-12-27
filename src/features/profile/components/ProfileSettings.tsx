import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, Loader2, User, Globe } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { toast } from 'sonner';

interface ProfileSettingsProps {
  userId: string;
}

export function ProfileSettings({ userId }: ProfileSettingsProps) {
  const { profile, loading, updateProfile, getShareUrl } = useProfile(userId);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync local state when profile loads
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      username: username || null,
      display_name: displayName || null,
    });
    setSaving(false);
  };

  const handleTogglePublic = async (enabled: boolean) => {
    if (enabled && !profile?.username) {
      toast.error('Please set a username first');
      return;
    }
    await updateProfile({ public_profile_enabled: enabled });
  };

  const handleCopyUrl = () => {
    const url = getShareUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success('Profile URL copied to clipboard');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const shareUrl = getShareUrl();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Public Profile
        </CardTitle>
        <CardDescription>
          Share a read-only view of your application progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/u/</span>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="your-username"
              maxLength={30}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            3-30 characters, lowercase letters, numbers, dashes, or underscores
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Profile
        </Button>

        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Enable Public Profile
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow anyone with the link to view your progress
              </p>
            </div>
            <Switch
              checked={profile?.public_profile_enabled || false}
              onCheckedChange={handleTogglePublic}
              disabled={!profile?.username}
            />
          </div>

          {profile?.public_profile_enabled && shareUrl && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
              <p className="text-sm font-medium">Your public profile URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background px-2 py-1 rounded border truncate">
                  {shareUrl}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
