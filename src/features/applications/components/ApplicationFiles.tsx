import { useRef } from 'react';
import { Upload, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApplicationFiles, ApplicationFile, validateFile } from '../hooks/useApplicationFiles';
import { useToast } from '@/hooks/use-toast';

interface ApplicationFilesProps {
  applicationId: string;
  userId: string | undefined;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ApplicationFiles({ applicationId, userId }: ApplicationFilesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { files, isLoading, uploading, uploadFile, deleteFile, downloadFile } = useApplicationFiles(applicationId, userId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: 'Invalid file',
          description: validation.error,
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }
      uploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Documents</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-1">Upload</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx"
        />
      </div>
      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX only. Max 5 MB.</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No documents uploaded</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onDownload={() => downloadFile(file)}
              onDelete={() => deleteFile(file)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface FileItemProps {
  file: ApplicationFile;
  onDownload: () => void;
  onDelete: () => void;
}

function FileItem({ file, onDownload, onDelete }: FileItemProps) {
  return (
    <li className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{file.file_name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
