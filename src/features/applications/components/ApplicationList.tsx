import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { differenceInDays, parseISO, isToday, isTomorrow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Application, ApplicationInput, StatusTransitionResult } from '../hooks/useApplications';
import { ApplicationForm } from './ApplicationForm';
import { StatusTransitionButtons } from './StatusTransitionButtons';
import { ApplicationFiles } from './ApplicationFiles';
import { ApplicationStatus } from '../utils/statusStateMachine';
import { ApplicationTimeline } from './ApplicationTimeline';
import { AddNoteForm } from './AddNoteForm';
import { FollowUpSection } from './FollowUpSection';
import { useApplicationNotes } from '../hooks/useApplicationNotes';
import { useApplicationEvents } from '../hooks/useApplicationEvents';

interface ApplicationListProps {
  applications: Application[];
  userId: string | undefined;
  onUpdate: (id: string, input: Partial<ApplicationInput>) => Promise<{ error?: Error | unknown }>;
  onDelete: (id: string) => Promise<{ error?: Error | unknown }>;
  onTransitionStatus: (id: string, newStatus: ApplicationStatus) => Promise<StatusTransitionResult>;
  loading: boolean;
}

const statusColors: Record<string, string> = {
  Applied: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  OA: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Interview: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Offer: 'bg-green-500/20 text-green-400 border-green-500/30',
  Accepted: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function DeadlineIndicator({ deadlineDate, reminderEnabled }: { deadlineDate: string | null; reminderEnabled: boolean }) {
  if (!deadlineDate || !reminderEnabled) return null;

  const deadline = parseISO(deadlineDate);
  const daysUntil = differenceInDays(deadline, new Date());

  // Only show indicator if deadline is within 3 days
  if (daysUntil > 3 || daysUntil < 0) return null;

  let message = '';
  let urgencyClass = '';

  if (isToday(deadline)) {
    message = 'Deadline today!';
    urgencyClass = 'text-destructive animate-pulse';
  } else if (isTomorrow(deadline)) {
    message = 'Deadline tomorrow';
    urgencyClass = 'text-yellow-500';
  } else {
    message = `Deadline in ${daysUntil} days`;
    urgencyClass = 'text-muted-foreground';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 ${urgencyClass}`}>
            <Clock className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Extracted component for expanded content to use hooks
function ExpandedApplicationContent({ applicationId, userId }: { applicationId: string; userId: string | undefined }) {
  const { notes, addNote } = useApplicationNotes(applicationId);
  const { events } = useApplicationEvents(applicationId);

  return (
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>
      <TabsContent value="timeline" className="space-y-4">
        <AddNoteForm onSubmit={addNote} />
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium mb-3">Activity</h4>
          <ApplicationTimeline events={events} notes={notes} />
        </div>
      </TabsContent>
      <TabsContent value="follow-ups">
        <FollowUpSection applicationId={applicationId} />
      </TabsContent>
      <TabsContent value="files">
        <ApplicationFiles applicationId={applicationId} userId={userId} />
      </TabsContent>
    </Tabs>
  );
}

export function ApplicationList({ applications, userId, onUpdate, onDelete, onTransitionStatus, loading }: ApplicationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleTransition = async (appId: string, newStatus: ApplicationStatus) => {
    setTransitioningId(appId);
    await onTransitionStatus(appId, newStatus);
    setTransitioningId(null);
  };

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
              <>
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {app.company}
                      <DeadlineIndicator deadlineDate={app.deadline_date} reminderEnabled={app.reminder_enabled} />
                    </div>
                  </TableCell>
                  <TableCell>{app.role}</TableCell>
                  <TableCell className="text-muted-foreground">{app.platform || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[app.status] || ''}>
                        {app.status}
                      </Badge>
                      <StatusTransitionButtons
                        currentStatus={app.status}
                        onTransition={(newStatus) => handleTransition(app.id, newStatus)}
                        disabled={transitioningId === app.id}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(app.applied_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                      >
                        {expandedId === app.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
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
                {expandedId === app.id && (
                  <TableRow key={`${app.id}-expanded`}>
                    <TableCell colSpan={6} className="bg-muted/30 p-4">
                      <ExpandedApplicationContent applicationId={app.id} userId={userId} />
                    </TableCell>
                  </TableRow>
                )}
              </>
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
