/**
 * 协议类型参数管理对话框
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProtocolType, ProtocolTypeParam } from '@/types'
import {
  useProtocolTypeParams,
  useCreateProtocolTypeParam,
  useUpdateProtocolTypeParam,
  useDeleteProtocolTypeParam,
} from '@/hooks/useProtocolTypeQueries'
import { ProtocolTypeParamFormDialog } from './ProtocolTypeParamFormDialog'
import { DeleteProtocolTypeParamDialog } from './DeleteProtocolTypeParamDialog'

interface ProtocolTypeParamsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolType: ProtocolType | null
}

export function ProtocolTypeParamsDialog({
  open,
  onOpenChange,
  protocolType,
}: ProtocolTypeParamsDialogProps) {
  const { t } = useTranslation('config')
  
  const [paramFormDialogOpen, setParamFormDialogOpen] = useState(false)
  const [deleteParamDialogOpen, setDeleteParamDialogOpen] = useState(false)
  const [selectedParam, setSelectedParam] = useState<ProtocolTypeParam | null>(null)
  
  // 获取参数列表
  const { data: paramsData, isLoading } = useProtocolTypeParams(protocolType?.id || 0)
  const params = (paramsData?.data as ProtocolTypeParam[] | null | undefined) || []
  
  const handleAddParam = () => {
    setSelectedParam(null)
    setParamFormDialogOpen(true)
  }
  
  const handleEditParam = (param: ProtocolTypeParam) => {
    setSelectedParam(param)
    setParamFormDialogOpen(true)
  }
  
  const handleDeleteParam = (param: ProtocolTypeParam) => {
    setSelectedParam(param)
    setDeleteParamDialogOpen(true)
  }
  
  const getDataTypeBadgeVariant = (dataType: string) => {
    switch (dataType) {
      case 'string':
        return 'default'
      case 'integer':
      case 'float':
        return 'secondary'
      case 'boolean':
        return 'outline'
      case 'enum':
        return 'destructive'
      default:
        return 'default'
    }
  }
  
  if (!protocolType) return null
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t('protocolType.params.title', { name: protocolType.display_name })}
            </DialogTitle>
            <DialogDescription>
              {t('protocolType.params.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))
                ) : params.length > 0 ? (
                  params.map((param, index) => (
                    <div
                      key={param.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-2 pt-1">
                        <GripVertical className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">#{param.order_index + 1}</span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{param.display_name}</span>
                          <Badge variant={getDataTypeBadgeVariant(param.data_type)}>
                            {param.data_type}
                          </Badge>
                          {param.required && (
                            <Badge variant="destructive" className="text-xs">
                              {t('protocolType.params.required')}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span className="font-mono">{param.param_name}</span>
                          {param.description && (
                            <span className="ml-2">- {param.description}</span>
                          )}
                        </div>
                        
                        {param.default_value && (
                          <div className="text-xs text-muted-foreground">
                            {t('protocolType.params.defaultValue')}: {param.default_value}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditParam(param)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteParam(param)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    {t('protocolType.params.empty')}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.close', { ns: 'common' })}
            </Button>
            <Button onClick={handleAddParam}>
              <Plus className="mr-2 size-4" />
              {t('protocolType.params.addParam')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 参数表单对话框 */}
      <ProtocolTypeParamFormDialog
        open={paramFormDialogOpen}
        onOpenChange={setParamFormDialogOpen}
        protocolType={protocolType}
        param={selectedParam}
      />
      
      {/* 删除参数确认对话框 */}
      <DeleteProtocolTypeParamDialog
        open={deleteParamDialogOpen}
        onOpenChange={setDeleteParamDialogOpen}
        param={selectedParam}
        protocolType={protocolType}
      />
    </>
  )
}

