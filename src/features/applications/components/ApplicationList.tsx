import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp, Clock, MoreVertical } from 'lucide-react';
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
  Applied: 'status-badge-applied',
  OA: 'status-badge-oa',
  Interview: 'status-badge-interview',
  Offer: 'status-badge-offer',
  Accepted: 'status-badge-accepted',
  Rejected: 'status-badge-rejected',
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
    urgencyClass = 'text-rose-500 animate-pulse';
  } else if (isTomorrow(deadline)) {
    message = 'Deadline tomorrow';
    urgencyClass = 'text-amber-500';
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
      <TabsList className="mb-4 bg-muted/50">
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No applications yet. Add your first one above!</p>
      </div>
    );
  }

  const editingApp = editingId ? applications.find(a => a.id === editingId) : null;

  return (
    <>
      {editingApp && (
        <div className="mb-6 p-5 border border-border rounded-xl bg-card shadow-card animate-scale-in">
          <h3 className="text-lg font-display font-semibold mb-4">Edit Application</h3>
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

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Company</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Platform</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Applied</TableHead>
              <TableHead className="w-[100px] font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app, index) => (
              <>
                <TableRow 
                  key={app.id} 
                  className="table-row-interactive group"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px]">{app.company}</span>
                      <DeadlineIndicator deadlineDate={app.deadline_date} reminderEnabled={app.reminder_enabled} />
                    </div>
                  </TableCell>
                  <TableCell className="truncate max-w-[120px]">{app.role}</TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">{app.platform || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`font-medium ${statusColors[app.status] || ''}`}>
                        {app.status}
                      </Badge>
                      <div className="hidden lg:block">
                        <StatusTransitionButtons
                          currentStatus={app.status}
                          onTransition={(newStatus) => handleTransition(app.id, newStatus)}
                          disabled={transitioningId === app.id}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {new Date(app.applied_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 btn-press"
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
                        className="h-8 w-8 btn-press opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditingId(app.id)}
                        disabled={editingId === app.id}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 btn-press opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteId(app.id)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedId === app.id && (
                  <TableRow key={`${app.id}-expanded`}>
                    <TableCell colSpan={6} className="bg-muted/20 p-5 animate-fade-in">
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
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-press">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) {
                  await onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-rose-500 text-white hover:bg-rose-600 btn-press"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
