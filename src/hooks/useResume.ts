import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { resumeApi } from '@/lib/api';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per PRD

interface Resume {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_hash: string;
  trade_program?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export function useResume() {
  const { user } = useAuth();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchResume = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await resumeApi.getDetails();
      setResume(data.resume || null);
    } catch {
      setResume(null);
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchResume(); }, [user]);

  const uploadResume = async (file: File, tradeProgram?: string) => {
    if (!user) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File must be under 2MB.');
      return;
    }

    setUploading(true);
    try {
      const data = await resumeApi.upload(file, tradeProgram);
      toast.success('Resume uploaded successfully!');
      setResume(data.resume);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const deleteResume = async () => {
    if (!user || !resume) return;
    try {
      await resumeApi.delete(resume.id);
      setResume(null);
      toast.success('Resume deleted.');
    } catch (err: any) {
      toast.error(err.message || 'Delete failed.');
    }
  };

  return { resume, loading, uploading, uploadResume, deleteResume, fetchResume };
}
