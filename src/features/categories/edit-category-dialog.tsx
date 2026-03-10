import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { categoryApi } from '@/services/api';
import { getCategoryColors, PALETTE_NAMES, type PaletteMode } from '@/shared/constants/colors';
import { MESSAGES } from '@/shared/constants/messages';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Check, Palette } from 'lucide-react';
import type { Category } from '@/entities/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useDialogViewportPosition } from '@/shared/hooks/use-dialog-viewport-position';

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  workspaceIdentifier: string;
}

// 카테고리 수정 다이얼로그 - 카테고리의 이름과 색상을 변경
// 사용 위치: features/categories/category-card
export const EditCategoryDialog = ({ open, onOpenChange, category, workspaceIdentifier }: EditCategoryDialogProps) => {
  const { colorPaletteMode, setColorPaletteMode } = useSettingsStore();
  const colors = getCategoryColors(colorPaletteMode);
  const [name, setName] = useState(category.name);
  const [selectedColor, setSelectedColor] = useState(category.color);
  const dialogRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];
  const dialogStyle = useDialogViewportPosition({ open, mode: 'bottom', keyboardOpenThreshold: 0.85 });

  const updateCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await categoryApi.update(category.id, {
        name: name.trim(),
        color: selectedColor,
      });

      if (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(MESSAGES.savedCategory.updateSuccess);
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.savedCategory.updateFailed;
      toast.error(message);
    },
  });

  // 팔레트 버튼 클릭 시 다음 팔레트 모드로 순환 전환
  const handleTogglePalette = () => {
    const modes: PaletteMode[] = ['vibrant', 'pastel', 'deep', 'soft', 'muted'];
    const currentIndex = modes.indexOf(colorPaletteMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setColorPaletteMode(nextMode);
  };

  // 다이얼로그 열릴 때 폼 데이터를 현재 카테고리 정보로 초기화
  useEffect(() => {
    if (open) {
      setColorPaletteMode('vibrant');
      setName(category.name);
      setSelectedColor(category.color);
    }
  }, [open, category, setColorPaletteMode]);

  // 카테고리 수정 요청 처리 - 유효성 검증 후 Edge Function을 통해 DB 업데이트
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 빈 문자열이나 공백만 있는 경우 수정 방지
    if (!name.trim()) {
      toast.error(UI_COPY.myCategory.nameRequired);
      return;
    }

    if (updateCategoryMutation.isPending) return;

    updateCategoryMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          ref={dialogRef} 
          className="transition-all duration-200"
          style={dialogStyle}
        >
        <DialogHeader>
          <DialogTitle>{UI_COPY.categoryDialog.edit.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* UserRequest: 색상을 7개씩 2줄로 중앙 정렬하여 배치하고 시각적 균형 유지 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{UI_COPY.categoryDialog.edit.colorLabel}</Label>
              <span className="text-xs text-muted-foreground">{PALETTE_NAMES[colorPaletteMode]}</span>
            </div>
            <div className="grid grid-cols-7 gap-2 justify-items-center">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-10 h-10 rounded-full border-2 border-border hover:scale-110 transition-transform relative"
                  style={{ backgroundColor: color }}
                  aria-label={UI_COPY.categoryDialog.colorSelectAriaLabel(color)}
                >
                  {selectedColor === color && (
                    <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md" />
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={handleTogglePalette}
                className="w-10 h-10 rounded-full border-2 border-dashed border-border hover:scale-110 transition-transform relative cursor-pointer flex items-center justify-center bg-background"
                aria-label={UI_COPY.categoryDialog.paletteToggleAriaLabel}
              >
                <Palette className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{UI_COPY.categoryDialog.edit.nameLabel}</Label>
            <Input
              id="name"
              placeholder={UI_COPY.categoryDialog.edit.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {UI_COPY.categoryDialog.edit.cancel}
            </Button>
            <Button type="submit" disabled={updateCategoryMutation.isPending || !name.trim()}>
              {updateCategoryMutation.isPending
                ? UI_COPY.categoryDialog.edit.submitting
                : UI_COPY.categoryDialog.edit.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
