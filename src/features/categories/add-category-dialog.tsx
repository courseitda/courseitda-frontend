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
import { addCategory } from '@/mock/edge-functions/category';
import { getCategoryColors, PALETTE_NAMES, type PaletteMode } from '@/shared/constants/colors';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Check, Palette } from 'lucide-react';
import { db } from '@/mock/db';

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

const SUGGESTED_CATEGORIES = ['점심', '카페', '산책', '쇼핑', '저녁'];

export const AddCategoryDialog = ({ open, onOpenChange, workspaceId }: AddCategoryDialogProps) => {
  const { colorPaletteMode, setColorPaletteMode } = useSettingsStore();
  const colors = getCategoryColors(colorPaletteMode);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // UserRequest: 카테고리 생성 시 사용하지 않은 색상으로 자동 선택
  // 워크스페이스의 기존 카테고리 색상들을 확인하여 사용하지 않은 색상을 선택
  const getNextAvailableColor = async (paletteMode: PaletteMode) => {
    const colors = getCategoryColors(paletteMode);
    
    // Get existing categories for this workspace
    const existingCategories = await db.categories
      .where('workspaceId')
      .equals(workspaceId)
      .toArray();
    
    // Extract used colors
    const usedColors = new Set(existingCategories.map(cat => cat.color));
    
    // Find first unused color
    const availableColor = colors.find(color => !usedColors.has(color));
    
    // Return available color or fallback to first color
    return availableColor || colors[0];
  };

  // Reset to vibrant mode when dialog opens and select unused color
  useEffect(() => {
    if (open) {
      setColorPaletteMode('vibrant');
      getNextAvailableColor('vibrant').then(color => {
        setSelectedColor(color);
      });
    }
  }, [open, setColorPaletteMode, workspaceId]);

  // Update selected color when palette changes - select unused color
  useEffect(() => {
    getNextAvailableColor(colorPaletteMode).then(color => {
      setSelectedColor(color);
    });
  }, [colorPaletteMode, workspaceId]);

  const handleTogglePalette = () => {
    const modes: PaletteMode[] = ['vibrant', 'pastel', 'deep', 'soft', 'muted'];
    const currentIndex = modes.indexOf(colorPaletteMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setColorPaletteMode(nextMode);
  };

  // UserRequest: 모바일에서 키보드가 올라오면 팝업창의 하단을 키보드 상단에 맞춤
  // Handle keyboard appearance on mobile - align dialog bottom to keyboard top
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
        // Calculate keyboard height
        const keyboardHeight = windowHeight - viewportHeight;
        setKeyboardOffset(keyboardHeight);
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

  const handleSubmit = async (categoryName: string) => {
    if (!categoryName.trim()) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    setLoading(true);

    const { category, error } = await addCategory({
      workspaceId,
      name: categoryName,
      color: selectedColor,
    });

    if (error || !category) {
      toast.error(error || '카테고리 추가에 실패했습니다.');
      setLoading(false);
      return;
    }

    toast.success('카테고리가 추가되었습니다!');
    setName('');
    // Select next unused color after adding category
    const nextColor = await getNextAvailableColor(colorPaletteMode);
    setSelectedColor(nextColor);
    onOpenChange(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={dialogRef} 
        className="transition-all duration-200"
        style={{
          top: keyboardOffset > 0 ? 'auto' : '50%',
          bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : 'auto',
          transform: keyboardOffset > 0 ? 'translateX(-50%)' : 'translate(-50%, -50%)'
        }}
      >
        <DialogHeader>
          <DialogTitle>카테고리 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
            <Label>추천 카테고리</Label>
            <div className="flex justify-center gap-2">
              {SUGGESTED_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(category)}
                  disabled={loading}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">직접 입력</Label>
            <Input
              id="name"
              placeholder="카테고리 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(name);
                }
              }}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button onClick={() => handleSubmit(name)} disabled={loading || !name.trim()}>
              {loading ? '추가 중...' : '추가'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
