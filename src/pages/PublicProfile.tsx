import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, Trophy, FileText, Eye, ArrowLeft } from 'lucide-react';

interface PublicProfileData {
  display_name: string;
  total_applications: number;
  interviews: number;
  offers: number;
  applications: Array<{
    company: string;
    role: string;
    status: string;
  }> | null;
}

const statusColors: Record<string, string> = {
  Applied: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  OA: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  Interview: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Offer: 'bg-green-500/10 text-green-600 border-green-500/20',
  Accepted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data: result, error } = await supabase
          .rpc('get_public_profile_data', { profile_username: username });

        if (error) throw error;

        if (!result || result.length === 0) {
          setNotFound(true);
        } else {
          setData(result[0] as PublicProfileData);
        }
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-display font-semibold text-foreground">Profile Not Found</h1>
        <p className="text-muted-foreground">This profile doesn't exist or is not public.</p>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-semibold text-foreground">
              InternTrack
            </span>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Eye className="h-3 w-3" />
            Read-only
          </Badge>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {data.display_name || 'Anonymous'}
            </h1>
            <p className="text-muted-foreground">Job Application Progress</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{data.total_applications}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-2">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-foreground">{data.interviews}</p>
                <p className="text-sm text-muted-foreground">Interviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-2">
                  <Trophy className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-foreground">{data.offers}</p>
                <p className="text-sm text-muted-foreground">Offers</p>
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {data.applications && data.applications.length > 0 ? (
                <div className="space-y-3">
                  {data.applications.map((app, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div>
                        <p className="font-medium text-foreground">{app.company}</p>
                        <p className="text-sm text-muted-foreground">{app.role}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusColors[app.status] || ''}
                      >
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No applications yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Powered by InternTrack
          </p>
        </div>
      </main>
    </div>
  );
}
