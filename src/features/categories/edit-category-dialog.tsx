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

  // Handle keyboard appearance on mobile
  useEffect(() => {
    if (!open) return;

    // Reset position when dialog opens
    if (dialogRef.current) {
      dialogRef.current.style.top = '50%';
      dialogRef.current.style.transform = 'translate(-50%, -50%)';
    }

    const handleViewportResize = () => {
      if (!dialogRef.current) return;
      
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      // Calculate the available height when keyboard is open
      const viewportHeight = visualViewport.height;
      const windowHeight = window.innerHeight;
      
      // Always keep top at 50%
      dialogRef.current.style.top = '50%';
      
      // If viewport is smaller than window, keyboard is likely open
      if (viewportHeight < windowHeight * 0.8) {
        // Position dialog in the center of visible viewport (excluding keyboard)
        const keyboardHeight = windowHeight - viewportHeight;
        const offsetY = keyboardHeight / 2;
        dialogRef.current.style.transform = `translate(-50%, calc(-50% - ${offsetY}px))`;
      } else {
        // Reset to center of screen
        dialogRef.current.style.transform = 'translate(-50%, -50%)';
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
      <DialogContent ref={dialogRef} className="transition-transform duration-200">
        <DialogHeader>
          <DialogTitle>카테고리 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

