import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Application, ApplicationInput } from '../hooks/useApplications';
import { ApplicationForm } from './ApplicationForm';

interface ApplicationListProps {
  applications: Application[];
  onUpdate: (id: string, input: Partial<ApplicationInput>) => Promise<{ error?: Error | unknown }>;
  onDelete: (id: string) => Promise<{ error?: Error | unknown }>;
  loading: boolean;
}

const statusColors: Record<string, string> = {
  Applied: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Screening: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Interview: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Offer: 'bg-green-500/20 text-green-400 border-green-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  Withdrawn: 'bg-muted text-muted-foreground border-muted',
};

export function ApplicationList({ applications, onUpdate, onDelete, loading }: ApplicationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading applications...</div>;
  }

  if (applications.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No applications yet. Add your first one above.</div>;
  }

  const editingApp = editingId ? applications.find(a => a.id === editingId) : null;

  return (
    <>
      {editingApp && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
          <h3 className="text-lg font-medium mb-4">Edit Application</h3>
          <ApplicationForm
            initialData={editingApp}
            onSubmit={async (input) => {
              const result = await onUpdate(editingId!, input);
              if (!result.error) setEditingId(null);
              return result;
            }}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.company}</TableCell>
                <TableCell>{app.role}</TableCell>
                <TableCell className="text-muted-foreground">{app.platform || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[app.status] || ''}>
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(app.applied_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(app.id)}
                      disabled={editingId === app.id}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(app.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) {
                  await onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
