import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';

interface AddNoteFormProps {
  onSubmit: (content: string) => Promise<boolean>;
}

export const AddNoteForm = ({ onSubmit }: AddNoteFormProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit(content);
    if (success) {
      setContent('');
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Add a note about this application..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
      />
      <Button 
        type="submit" 
        size="sm" 
        disabled={!content.trim() || isSubmitting}
        className="gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Add Note
      </Button>
    </form>
  );
};
