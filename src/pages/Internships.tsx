import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useInternships, InternshipForm, InternshipList } from '@/features/internships';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';

export default function Internships() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { internships, loading, createInternship, updateInternship, deleteInternship } = useInternships();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCreate = async (data: Parameters<typeof createInternship>[0]) => {
    try {
      await createInternship(data);
      toast.success('Internship added successfully!');
    } catch (err) {
      toast.error('Failed to add internship');
    }
  };

  const handleUpdate = async (id: string, data: Parameters<typeof updateInternship>[1]) => {
    try {
      await updateInternship(id, data);
      toast.success('Internship updated successfully!');
    } catch (err) {
      toast.error('Failed to update internship');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInternship(id);
      toast.success('Internship deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete internship');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="app-depth-layer" />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Briefcase className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Internships</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Internship</CardTitle>
              <CardDescription>Track your internship applications</CardDescription>
            </CardHeader>
            <CardContent>
              <InternshipForm onSubmit={handleCreate} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Internships</CardTitle>
              <CardDescription>
                {internships.length} internship{internships.length !== 1 ? 's' : ''} tracked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InternshipList
                internships={internships}
                loading={loading}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
