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
import { updateCategory } from '@/mock/edge-functions/category';
import { getCategoryColors, PALETTE_NAMES, type PaletteMode } from '@/shared/constants/colors';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Check, Palette } from 'lucide-react';
import type { Category } from '@/entities/types';

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

export const EditCategoryDialog = ({ open, onOpenChange, category }: EditCategoryDialogProps) => {
  const { colorPaletteMode, setColorPaletteMode } = useSettingsStore();
  const colors = getCategoryColors(colorPaletteMode);
  const [name, setName] = useState(category.name);
  const [selectedColor, setSelectedColor] = useState(category.color);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const handleTogglePalette = () => {
    const modes: PaletteMode[] = ['vibrant', 'pastel', 'deep', 'soft', 'muted'];
    const currentIndex = modes.indexOf(colorPaletteMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setColorPaletteMode(nextMode);
  };

  // Reset form and palette when dialog opens with new category
  useEffect(() => {
    if (open) {
      setColorPaletteMode('vibrant');
      setName(category.name);
      setSelectedColor(category.color);
    }
  }, [open, category, setColorPaletteMode]);

  // UserRequest: 키보드가 올라왔을 때 키보드를 제외한 남은 화면 기준으로 정중앙 정렬
  // Handle keyboard appearance on mobile - center dialog in visible viewport
  useEffect(() => {
    if (!open) {
      setKeyboardOffset(0);
      return;
    }

    const handleViewportResize = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) {
        setKeyboardOffset(0);
        return;
      }

      // Calculate the available height when keyboard is open
      const viewportHeight = visualViewport.height;
      const windowHeight = window.innerHeight;
      
      // If viewport is significantly smaller than window, keyboard is open
      if (viewportHeight < windowHeight * 0.85) {
        // Calculate offset to center dialog in visible viewport (excluding keyboard)
        // We need to shift the dialog up by half the keyboard height
        const keyboardHeight = windowHeight - viewportHeight;
        const offset = keyboardHeight / 2;
        setKeyboardOffset(offset);
      } else {
        // Reset to center of full screen
        setKeyboardOffset(0);
      }
    };

    // Initial call
    handleViewportResize();

    // Check if visualViewport is supported (modern mobile browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
        window.visualViewport?.removeEventListener('scroll', handleViewportResize);
      };
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    setLoading(true);

    const { error } = await updateCategory(category.id, {
      name: name.trim(),
      color: selectedColor,
    });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    toast.success('카테고리가 수정되었습니다!');
    onOpenChange(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={dialogRef} 
        className="transition-all duration-200"
        style={{
          top: keyboardOffset > 0 
            ? `calc(50% - ${keyboardOffset}px)` 
            : '50%'
        }}
      >
        <DialogHeader>
          <DialogTitle>카테고리 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* UserRequest: 색상을 7개씩 2줄로 중앙 정렬하여 배치 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>색상 선택</Label>
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
                  aria-label={`색상 ${color} 선택`}
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
                aria-label="색상 팔레트 변경"
              >
                <Palette className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">카테고리 이름</Label>
            <Input
              id="name"
              placeholder="카테고리 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? '수정 중...' : '확인'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

