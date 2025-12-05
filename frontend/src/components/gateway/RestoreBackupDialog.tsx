/**
 * 还原数据库备份对话框（3步向导）
 */
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Upload,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

import { validateBackup, restoreBackup } from '@/api/gateway';
import type { BackupValidation } from '@/types/gateway';

interface RestoreBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestoreBackupDialog({
  open,
  onOpenChange,
}: RestoreBackupDialogProps) {
  const { t } = useTranslation(['gateway', 'common']);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 四个步骤的状态（增加步骤4：成功报告，步骤5：失败报告）
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<BackupValidation | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [forceRestore, setForceRestore] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // 验证备份
  const validateMutation = useMutation({
    mutationFn: validateBackup,
    onSuccess: (response) => {
      if (response.success && response.data) {
        setValidation(response.data);
        setStep(2);
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || t('gateway:error.backup_validate_failed')
      );
    },
  });

  // 还原备份
  const restoreMutation = useMutation({
    mutationFn: ({ file, force }: { file: File; force: boolean }) =>
      restoreBackup(file, {
        confirm_text: confirmText,
        force,
      }),
    onSuccess: (response) => {
      toast.success(response.message || t('gateway:success.backup_restored'));
      
      // 保存还原结果并显示步骤4
      setRestoreResult(response.data);
      setStep(4);
      
      // 刷新备份列表（会显示新的安全备份）
      queryClient.invalidateQueries({ queryKey: ['gateway', 'security'] });
    },
    onError: (error: any) => {
      const errorDetail = error.response?.data?.detail || t('gateway:error.backup_restore_failed');
      toast.error(errorDetail);
      
      // 保存错误信息并显示步骤5失败报告
      setRestoreError(errorDetail);
      setStep(5);
    },
  });

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // 处理上传和验证
  const handleUploadAndValidate = () => {
    if (!selectedFile) {
      toast.error(t('gateway:error.no_file_selected'));
      return;
    }

    validateMutation.mutate(selectedFile);
  };

  // 处理还原
  const handleRestore = () => {
    if (!selectedFile) return;
    if (confirmText !== 'RESTORE') {
      toast.error(t('gateway:error.invalid_confirm_text'));
      return;
    }

    setStep(3);
    restoreMutation.mutate({
      file: selectedFile,
      force: forceRestore,
    });
  };

  // 关闭对话框并重置状态
  const handleClose = () => {
    setStep(1);
    setSelectedFile(null);
    setValidation(null);
    setConfirmText('');
    setForceRestore(false);
    setRestoreResult(null);
    setRestoreError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  // 关闭并刷新页面
  const handleCloseAndRefresh = () => {
    handleClose();
    toast.info(t('gateway:restore.page_refresh_hint'));
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // 获取警告样式
  const getWarningStyle = (level: string) => {
    switch (level) {
      case 'safe':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          variant: 'default' as const,
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          variant: 'default' as const,
        };
      case 'danger':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          variant: 'default' as const,
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('gateway:restore.title')}</DialogTitle>
          <DialogDescription>
            {step === 1 && t('gateway:restore.step1_description')}
            {step === 2 && t('gateway:restore.step2_description')}
            {step === 3 && t('gateway:restore.step3_description')}
            {step === 4 && t('gateway:restore.step4_description')}
            {step === 5 && t('gateway:restore.step5_description')}
          </DialogDescription>
        </DialogHeader>

        {/* 步骤指示器（失败时显示错误） */}
        {step !== 5 && (
          <div className="flex items-center justify-center gap-4 py-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step >= num
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-muted text-muted-foreground'
                  }`}
                >
                  {step === 4 && num === 4 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    num
                  )}
                </div>
                {num < 4 && (
                  <div
                    className={`mx-2 h-0.5 w-12 ${
                      step > num ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 步骤1：上传文件 */}
        {step === 1 && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('gateway:restore.warning_title')}</AlertTitle>
              <AlertDescription>
                {t('gateway:restore.warning_message')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="backup-file">{t('gateway:restore.select_file')}</Label>
              <div className="flex gap-2">
                <Input
                  id="backup-file"
                  type="file"
                  accept=".ren"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {t('gateway:restore.selected_file')}: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
        )}

        {/* 步骤2：预览验证 */}
        {step === 2 && validation && (
          <div className="space-y-4">
            <Alert variant={getWarningStyle(validation.warning_level).variant}>
              {getWarningStyle(validation.warning_level).icon}
              <AlertTitle>{t('gateway:restore.validation_result')}</AlertTitle>
              <AlertDescription>{validation.warning_message}</AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold">{t('gateway:restore.backup_info')}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('gateway:restore.project')}:</span>
                  <span className="ml-2">{validation.metadata.project_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('gateway:restore.machine_uuid')}:</span>
                  <span className="ml-2 font-mono text-xs">
                    {validation.metadata.machine_uuid.slice(0, 16)}...
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('gateway:restore.db_version')}:</span>
                  <span className="ml-2">{validation.metadata.db_version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('gateway:restore.app_version')}:</span>
                  <span className="ml-2">{validation.metadata.app_version}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('gateway:restore.backup_time')}:</span>
                  <span className="ml-2">{validation.metadata.backup_time}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold">{t('gateway:restore.statistics')}</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {Object.entries(validation.statistics).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-muted-foreground">{t(`gateway:restore.stat_${key}`)}:</span>
                    <span className="ml-2 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>{t('gateway:restore.safety_backup_title')}</AlertTitle>
              <AlertDescription>
                {t('gateway:restore.safety_backup_message')}
              </AlertDescription>
            </Alert>

            {validation.warning_level !== 'safe' && (
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="force-restore"
                  checked={forceRestore}
                  onCheckedChange={(checked) => setForceRestore(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="force-restore"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('gateway:restore.force_restore')}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t('gateway:restore.force_restore_hint')}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirm-text">{t('gateway:restore.confirm_label')}</Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESTORE"
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                {t('gateway:restore.confirm_hint')}
              </p>
            </div>
          </div>
        )}

        {/* 步骤3：还原中 */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{t('gateway:restore.restoring')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('gateway:restore.please_wait')}
              </p>
            </div>
            <div className="w-full max-w-md space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{t('gateway:restore.step_backup_current')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{t('gateway:restore.step_validate_backup')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{t('gateway:restore.step_replace_database')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="h-4 w-4" />
                <span>{t('gateway:restore.step_reconnect')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 步骤4：还原成功报告 */}
        {step === 4 && restoreResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>{t('gateway:restore.success_title')}</AlertTitle>
              <AlertDescription>
                {t('gateway:restore.success_message')}
              </AlertDescription>
            </Alert>

            {/* 还原信息 */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold">{t('gateway:restore.restore_info')}</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">{t('gateway:restore.restored_from')}:</div>
                  <div className="font-mono text-xs bg-muted/50 p-2 rounded break-all">
                    {restoreResult.restored_from}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{t('gateway:restore.safety_backup_file')}:</div>
                  <div className="font-mono text-xs bg-muted/50 p-2 rounded break-all">
                    {restoreResult.safety_backup}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">{t('gateway:restore.restore_duration')}:</span>
                    <span className="ml-2 font-semibold">{restoreResult.restore_duration_seconds}s</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('gateway:restore.changes_count')}:</span>
                    <span className="ml-2 font-semibold">{restoreResult.total_changes}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 数据变化对比 */}
            {restoreResult.total_changes > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-semibold">{t('gateway:restore.data_changes')}</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(restoreResult.changes as Record<string, any>).map(([key, change]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">{t(`gateway:restore.stat_${key}`)}:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">{change.before}</span>
                        <span>→</span>
                        <span className="text-green-500 font-semibold">{change.after}</span>
                        <span className={change.diff > 0 ? 'text-green-500' : 'text-red-500'}>
                          ({change.diff > 0 ? '+' : ''}{change.diff})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {restoreResult.total_changes === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{t('gateway:restore.no_changes_title')}</AlertTitle>
                <AlertDescription>
                  {t('gateway:restore.no_changes_message')}
                </AlertDescription>
              </Alert>
            )}

            {/* 重要提示 */}
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('gateway:restore.refresh_required_title')}</AlertTitle>
              <AlertDescription>
                {t('gateway:restore.refresh_required_message')}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* 步骤5：还原失败报告 */}
        {step === 5 && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('gateway:restore.failure_title')}</AlertTitle>
              <AlertDescription>
                {t('gateway:restore.failure_message')}
              </AlertDescription>
            </Alert>

            {/* 错误详情 */}
            <div className="rounded-lg border border-destructive/50 p-4 space-y-3">
              <h4 className="font-semibold text-destructive">{t('gateway:restore.error_details')}</h4>
              <div className="rounded bg-destructive/10 p-3">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-destructive">
                  {restoreError}
                </pre>
              </div>
            </div>

            {/* 回滚状态检查 */}
            {restoreError?.includes('rolled back') ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>{t('gateway:restore.rollback_success_title')}</AlertTitle>
                <AlertDescription>
                  {t('gateway:restore.rollback_success_message')}
                </AlertDescription>
              </Alert>
            ) : restoreError?.includes('rollback also failed') ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('gateway:restore.rollback_failed_title')}</AlertTitle>
                <AlertDescription>
                  {t('gateway:restore.rollback_failed_message')}
                </AlertDescription>
              </Alert>
            ) : null}

            {/* 后续建议 */}
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold">{t('gateway:restore.suggestions_title')}</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>{t('gateway:restore.suggestion_check_file')}</li>
                <li>{t('gateway:restore.suggestion_check_permission')}</li>
                <li>{t('gateway:restore.suggestion_check_disk')}</li>
                <li>{t('gateway:restore.suggestion_contact_admin')}</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('common:action.cancel')}
              </Button>
              <Button
                onClick={handleUploadAndValidate}
                disabled={!selectedFile || validateMutation.isPending}
              >
                {validateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('gateway:restore.next_step')}
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setValidation(null);
                  setConfirmText('');
                  setForceRestore(false);
                }}
              >
                {t('gateway:restore.previous_step')}
              </Button>
              <Button
                onClick={handleRestore}
                disabled={
                  confirmText !== 'RESTORE' ||
                  (validation?.warning_level !== 'safe' && !forceRestore) ||
                  restoreMutation.isPending
                }
                variant="destructive"
              >
                {restoreMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('gateway:restore.confirm_restore')}
              </Button>
            </>
          )}
          {step === 3 && null}
          {step === 4 && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('gateway:restore.close_only')}
              </Button>
              <Button onClick={handleCloseAndRefresh}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('gateway:restore.close_and_refresh')}
              </Button>
            </>
          )}
          {step === 5 && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep(2);
                  setRestoreError(null);
                }}
              >
                {t('gateway:restore.retry')}
              </Button>
              <Button onClick={handleClose}>
                {t('common:action.cancel')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

