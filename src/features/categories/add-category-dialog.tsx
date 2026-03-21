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

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceIdentifier: string;
  categories: Category[];
}

// 카테고리 추가 다이얼로그 - 색상 선택과 이름 입력을 통해 새 카테고리 생성
// 사용 위치: features/categories/category-list
export const AddCategoryDialog = ({ open, onOpenChange, workspaceIdentifier, categories }: AddCategoryDialogProps) => {
  const { colorPaletteMode, setColorPaletteMode } = useSettingsStore();
  const colors = getCategoryColors(colorPaletteMode);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];
  const dialogStyle = useDialogViewportPosition({ open, mode: 'bottom', keyboardOpenThreshold: 0.85 });

  const computeNextAvailableColor = (paletteMode: PaletteMode, usedCategories: Category[]) => {
    const palette = getCategoryColors(paletteMode);
    const usedColors = new Set(usedCategories.map((category) => category.color));
    return palette.find((color) => !usedColors.has(color)) ?? palette[0];
  };

  const addCategoryMutation = useMutation({
    mutationFn: async (payload: { name: string; color: string }) => {
      const { category, error } = await categoryApi.add({
        workspaceIdentifier,
        name: payload.name,
        color: payload.color,
      });

      if (!category || error) {
        throw new Error(error || MESSAGES.savedCategory.addFailed);
      }

      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(MESSAGES.savedCategory.addSuccess);
      setName('');
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.savedCategory.addFailed;
      toast.error(message);
    },
  });

  // 다이얼로그 열릴 때마다 기본 팔레트(vibrant)로 초기화하고 사용하지 않은 색상 자동 선택
  useEffect(() => {
    if (open) {
      setColorPaletteMode('vibrant');
      setSelectedColor(computeNextAvailableColor('vibrant', categories));
      setName('');
    }
  }, [open, categories, setColorPaletteMode]);

  // 팔레트 변경 시 해당 팔레트에서 사용하지 않은 색상으로 자동 업데이트
  useEffect(() => {
    if (!open) return;
    const nextColor = computeNextAvailableColor(colorPaletteMode, categories);
    setSelectedColor((currentColor) => {
      const isColorInPalette = colors.includes(currentColor);
      const isColorUnused = !categories.some((category) => category.color === currentColor);
      if (isColorInPalette && isColorUnused) {
        return currentColor;
      }
      return nextColor;
    });
  }, [open, colorPaletteMode, categories, colors]);

  // 팔레트 버튼 클릭 시 다음 팔레트 모드로 순환 전환
  const handleTogglePalette = () => {
    const modes: PaletteMode[] = ['vibrant', 'pastel', 'deep', 'soft', 'muted'];
    const currentIndex = modes.indexOf(colorPaletteMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setColorPaletteMode(nextMode);
  };

  // 카테고리 추가 요청 처리 - 유효성 검증 후 Edge Function을 통해 DB에 저장
  const handleSubmit = (categoryName: string) => {
    // 빈 문자열이나 공백만 있는 경우 추가 방지
    if (!categoryName.trim()) {
      toast.error(UI_COPY.myCategory.nameRequired);
      return;
    }

    if (addCategoryMutation.isPending) return;

    addCategoryMutation.mutate({
      name: categoryName.trim(),
      color: selectedColor,
    });
  };

  const isSubmitting = addCategoryMutation.isPending;

  const handleSuggestedClick = (categoryName: string) => {
    if (isSubmitting) return;
    handleSubmit(categoryName);
  };

  const handleManualSubmit = () => {
    if (isSubmitting) return;
    handleSubmit(name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          ref={dialogRef} 
          className="transition-all duration-200"
          style={dialogStyle}
        >
        <DialogHeader>
          <DialogTitle>{UI_COPY.categoryDialog.add.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* UserRequest: 색상 순서를 유지하되 공간이 부족하면 간격을 먼저 줄이고, 더 줄이기 어려우면 다음 줄로 넘긴다. */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{UI_COPY.categoryDialog.add.colorLabel}</Label>
              <span className="text-xs text-muted-foreground">{PALETTE_NAMES[colorPaletteMode]}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-[clamp(0.125rem,1.2vw,0.5rem)]">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="relative h-10 w-10 shrink-0 rounded-full border-2 border-border transition-transform hover:scale-110"
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
                className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border bg-background transition-transform hover:scale-110"
                aria-label={UI_COPY.categoryDialog.paletteToggleAriaLabel}
              >
                <Palette className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{UI_COPY.categoryDialog.add.suggestedLabel}</Label>
            <div className="flex flex-wrap justify-center gap-2">
              {UI_COPY.categoryDialog.suggestedCategories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedClick(category)}
                  disabled={isSubmitting}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{UI_COPY.categoryDialog.add.manualInputLabel}</Label>
            <Input
              id="name"
              placeholder={UI_COPY.categoryDialog.add.manualInputPlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleManualSubmit();
                }
              }}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {UI_COPY.categoryDialog.add.cancel}
            </Button>
            <Button onClick={handleManualSubmit} disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? UI_COPY.categoryDialog.add.submitting : UI_COPY.categoryDialog.add.submit}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
