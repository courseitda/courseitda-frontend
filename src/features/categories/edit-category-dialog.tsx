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
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Check, Palette } from 'lucide-react';
import type { Category } from '@/entities/types';

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

// 카테고리 수정 다이얼로그 - 카테고리의 이름과 색상을 변경
// 사용 위치: features/categories/category-card
export const EditCategoryDialog = ({ open, onOpenChange, category }: EditCategoryDialogProps) => {
  const { colorPaletteMode, setColorPaletteMode } = useSettingsStore();
  const colors = getCategoryColors(colorPaletteMode);
  const [name, setName] = useState(category.name);
  const [selectedColor, setSelectedColor] = useState(category.color);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

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

  // UserRequest: 모바일에서 키보드가 올라오면 팝업창의 하단을 키보드 상단에 맞춰 입력 필드가 가려지지 않도록 처리
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

  // 카테고리 수정 요청 처리 - 유효성 검증 후 Edge Function을 통해 DB 업데이트
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 빈 문자열이나 공백만 있는 경우 수정 방지
    if (!name.trim()) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    setLoading(true);

    // API 서비스 레이어를 통해 카테고리 정보 업데이트 (백엔드 연동 시 categoryApi만 수정)
    const { error } = await categoryApi.update(category.id, {
      name: name.trim(),
      color: selectedColor,
    });

    // 수정 실패 시 에러 메시지 표시
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    // 수정 성공 후 다이얼로그 닫기
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
          top: keyboardOffset > 0 ? 'auto' : '50%',
          bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : 'auto',
          transform: keyboardOffset > 0 ? 'translateX(-50%)' : 'translate(-50%, -50%)'
        }}
      >
        <DialogHeader>
          <DialogTitle>카테고리 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* UserRequest: 색상을 7개씩 2줄로 중앙 정렬하여 배치하고 시각적 균형 유지 */}
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

