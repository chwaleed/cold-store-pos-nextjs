'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Database,
  Download,
  Upload,
  Settings,
  Calendar,
  FolderOpen,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileUp,
} from 'lucide-react';
import {
  BackupSettings,
  backupSettingsSchema,
  BackupFrequency,
} from '@/schema/backup';
import { BackupInfo } from '@/types/backup';
import { format } from 'date-fns';

export function BackupManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BackupSettings>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: {
      isEnabled: false,
      frequency: 'daily',
      backupPath: '',
      retentionDays: 30,
    },
  });

  const isEnabled = watch('isEnabled');
  const backupPath = watch('backupPath');

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/backup/settings');
      const data = await response.json();

      if (data.success && data.settings) {
        setSettings(data.settings);
        setValue('isEnabled', data.settings.isEnabled);
        setValue('frequency', data.settings.frequency);
        setValue('backupPath', data.settings.backupPath);
        setValue('retentionDays', data.settings.retentionDays);
        if (data.settings.lastBackupDate) {
          setValue('lastBackupDate', data.settings.lastBackupDate);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load backup settings');
    }
  }, [setValue]);

  const loadBackups = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/backup/list?backupPath=${encodeURIComponent(backupPath)}`
      );
      const data = await response.json();

      if (data.success) {
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  }, [backupPath]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load backups when path changes
  useEffect(() => {
    if (backupPath) {
      loadBackups();
    }
  }, [backupPath, loadBackups]);

  const onSubmit = async (data: BackupSettings) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/backup/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Backup settings saved successfully');
        setSettings(data);
        loadBackups();
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save backup settings');
    } finally {
      setIsSaving(false);
    }
  };

  const createManualBackup = async () => {
    if (!backupPath) {
      toast.error('Please set a backup path first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/backup/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupPath }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Backup created: ${data.fileName}`);
        loadBackups();
        loadSettings(); // Reload to get updated lastBackupDate
      } else {
        toast.error(data.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async (filePath: string, fileName: string) => {
    if (
      !confirm(
        `Are you sure you want to restore from "${fileName}"? This will replace all current data.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupFilePath: filePath }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully restored ${data.restoredRecords} records`);
      } else {
        toast.error(data.error || 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore backup');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.db') && !file.name.endsWith('.json')) {
      toast.error(
        'Invalid file format. Please upload a .db or .json backup file.'
      );
      return;
    }

    setUploadFile(file);
  };

  const uploadAndRestoreBackup = async () => {
    if (!uploadFile) {
      toast.error('Please select a backup file to upload');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to restore from "${uploadFile.name}"? This will replace ALL current data.`
      )
    ) {
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch('/api/backup/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully restored ${data.restoredRecords} records`);
        setUploadFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          'backup-upload'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        loadSettings(); // Refresh settings after restore
      } else {
        toast.error(data.error || 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Error uploading backup:', error);
      toast.error('Failed to upload and restore backup');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadBackup = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(
        `/api/backup/download?filePath=${encodeURIComponent(filePath)}`
      );

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Downloaded ${fileName}`);
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Backup Configuration
          </CardTitle>
          <CardDescription>
            Configure automatic backups and set backup location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Backup Path */}
            <div className="space-y-2">
              <Label htmlFor="backupPath">Backup Folder Path</Label>
              <Input
                id="backupPath"
                placeholder="e.g., D:/Backups/POS or /home/user/backups"
                {...register('backupPath')}
              />
              {errors.backupPath && (
                <p className="text-sm text-red-500">
                  {errors.backupPath.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Full path to the folder where backups will be stored
              </p>
            </div>

            {/* Enable Automatic Backup */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="isEnabled">Enable Automatic Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically create backups based on schedule
                </p>
              </div>
              <input
                type="checkbox"
                id="isEnabled"
                {...register('isEnabled')}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            {/* Frequency */}
            {isEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Backup Frequency</Label>
                  <Select
                    value={watch('frequency')}
                    onValueChange={(value: BackupFrequency) =>
                      setValue('frequency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Retention Days */}
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Retention Days</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min="1"
                    max="365"
                    {...register('retentionDays', { valueAsNumber: true })}
                  />
                  {errors.retentionDays && (
                    <p className="text-sm text-red-500">
                      {errors.retentionDays.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Automatically delete backups older than this many days
                  </p>
                </div>
              </>
            )}

            {/* Last Backup Info */}
            {settings?.lastBackupDate && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Last Backup:</span>
                  <span>
                    {format(new Date(settings.lastBackupDate), 'PPpp')}
                  </span>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Manual Backup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manual Backup & Download
          </CardTitle>
          <CardDescription>
            Create a backup immediately and download it to your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={createManualBackup}
            disabled={isLoading || !backupPath}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Create Backup Now
              </>
            )}
          </Button>
          {!backupPath && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Please set a backup path in the configuration above
            </p>
          )}
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              💡 Tip: You can download backups from the list below to save them
              on external storage or cloud
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload & Restore Card - NEW */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-blue-600" />
            Upload & Restore Backup
          </CardTitle>
          <CardDescription>
            Upload a backup file (.db or .json) to restore your data - No path
            configuration needed!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-upload">Select Backup File</Label>
            <Input
              id="backup-upload"
              type="file"
              accept=".db,.json"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="cursor-pointer"
            />
            {uploadFile && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Selected: {uploadFile.name} ({formatBytes(uploadFile.size)})
              </div>
            )}
          </div>
          <Button
            onClick={uploadAndRestoreBackup}
            disabled={!uploadFile || isUploading}
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Restore
              </>
            )}
          </Button>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm space-y-1">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              ⚠️ Important Notes:
            </p>
            <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1 ml-2">
              <li>This will replace ALL current data</li>
              <li>Supports both .db (recommended) and .json formats</li>
              <li>Works even if database is corrupted</li>
              <li>No backup path configuration required</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Backup List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Available Backups
          </CardTitle>
          <CardDescription>
            List of all backup files in the backup folder
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No backups found</p>
              {backupPath && (
                <p className="text-sm mt-1">
                  Create your first backup to get started
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.fileName}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-2">
                      {backup.fileName}
                      {backup.fileName.endsWith('.db') && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-0.5 rounded">
                          SQLite
                        </span>
                      )}
                      {backup.fileName.endsWith('.json') && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 px-2 py-0.5 rounded">
                          JSON (Legacy)
                        </span>
                      )}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>{format(new Date(backup.createdAt), 'PPp')}</span>
                      <span>{formatBytes(backup.size)}</span>
                      {backup.metadata && (
                        <span>{backup.metadata.recordCount} records</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadBackup(backup.filePath, backup.fileName)
                      }
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        restoreBackup(backup.filePath, backup.fileName)
                      }
                      disabled={isLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
