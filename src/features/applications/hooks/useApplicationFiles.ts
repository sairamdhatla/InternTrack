import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApplicationFile {
  id: string;
  application_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export function useApplicationFiles(applicationId: string, userId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['application-files', applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('application_files')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApplicationFile[];
    },
    enabled: !!applicationId && !!userId,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error('User not authenticated');
      
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${userId}/${applicationId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create file record
      const { data, error: insertError } = await supabase
        .from('application_files')
        .insert({
          application_id: applicationId,
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) {
        // Cleanup storage if record creation fails
        await supabase.storage.from('application-documents').remove([filePath]);
        throw insertError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-files', applicationId] });
      toast({ title: 'File uploaded successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (file: ApplicationFile) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('application-documents')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error: deleteError } = await supabase
        .from('application_files')
        .delete()
        .eq('id', file.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-files', applicationId] });
      toast({ title: 'File deleted' });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const downloadFile = async (file: ApplicationFile) => {
    const { data, error } = await supabase.storage
      .from('application-documents')
      .download(file.file_path);

    if (error) {
      toast({
        title: 'Download failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    files,
    isLoading,
    uploading,
    uploadFile: uploadFile.mutate,
    deleteFile: deleteFile.mutate,
    downloadFile,
  };
}
