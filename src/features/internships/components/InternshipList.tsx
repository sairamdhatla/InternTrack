import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Internship, InternshipInput } from '../hooks/useInternships';
import { InternshipForm } from './InternshipForm';

interface InternshipListProps {
  internships: Internship[];
  loading: boolean;
  onUpdate: (id: string, data: Partial<InternshipInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Screening: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Interview: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Offer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_OPTIONS = ['Applied', 'Screening', 'Interview', 'Offer', 'Accepted', 'Rejected'];

export function InternshipList({ internships, loading, onUpdate, onDelete }: InternshipListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingStatusId(id);
    try {
      await onUpdate(id, { status: newStatus });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (internships.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No internships found. Add your first internship above!
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {internships.map((internship) => (
            <TableRow key={internship.id}>
              {editingId === internship.id ? (
                <TableCell colSpan={5} className="p-4">
                  <InternshipForm
                    initialData={{
                      company: internship.company,
                      role: internship.role,
                      status: internship.status,
                      applied_date: internship.applied_date,
                    }}
                    onSubmit={async (data) => {
                      await onUpdate(internship.id, data);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </TableCell>
              ) : (
                <>
                  <TableCell className="font-medium">{internship.company}</TableCell>
                  <TableCell>{internship.role}</TableCell>
                  <TableCell>
                    <Select
                      value={internship.status}
                      onValueChange={(value) => handleStatusChange(internship.id, value)}
                      disabled={updatingStatusId === internship.id}
                    >
                      <SelectTrigger className="w-[130px]">
                        <Badge className={statusColors[internship.status] || 'bg-gray-100 text-gray-800'}>
                          {internship.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
                              {status}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{format(new Date(internship.applied_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(internship.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Internship</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this internship at {internship.company}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(internship.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
