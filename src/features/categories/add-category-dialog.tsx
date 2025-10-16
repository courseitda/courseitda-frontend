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

// 자주 사용하는 카테고리를 제안하여 빠른 입력 지원
const SUGGESTED_CATEGORIES = ['점심', '카페', '산책', '쇼핑', '저녁'];

// 카테고리 추가 다이얼로그 - 색상 선택과 이름 입력을 통해 새 카테고리 생성
export const AddCategoryDialog = ({ open, onOpenChange, workspaceId }: AddCategoryDialogProps) => {
  const { colorPaletteMode, setColorPaletteMode } = useSettingsStore();
  const colors = getCategoryColors(colorPaletteMode);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // UserRequest: 카테고리 생성 시 사용하지 않은 색상으로 자동 선택하여 중복 방지 및 시각적 구분성 향상
  const getNextAvailableColor = async (paletteMode: PaletteMode) => {
    const colors = getCategoryColors(paletteMode);
    
    // 워크스페이스의 기존 카테고리 목록 조회
    const existingCategories = await db.categories
      .where('workspaceId')
      .equals(workspaceId)
      .toArray();
    
    // 이미 사용 중인 색상들을 Set으로 추출하여 빠른 검색
    const usedColors = new Set(existingCategories.map(cat => cat.color));
    
    // 팔레트에서 사용하지 않은 첫 번째 색상 찾기
    const availableColor = colors.find(color => !usedColors.has(color));
    
    // 사용 가능한 색상이 있으면 반환, 없으면 첫 번째 색상 사용
    return availableColor || colors[0];
  };

  // 다이얼로그 열릴 때마다 기본 팔레트(vibrant)로 초기화하고 사용하지 않은 색상 자동 선택
  useEffect(() => {
    if (open) {
      setColorPaletteMode('vibrant');
      getNextAvailableColor('vibrant').then(color => {
        setSelectedColor(color);
      });
    }
  }, [open, setColorPaletteMode, workspaceId]);

  // 팔레트 변경 시 해당 팔레트에서 사용하지 않은 색상으로 자동 업데이트
  useEffect(() => {
    getNextAvailableColor(colorPaletteMode).then(color => {
      setSelectedColor(color);
    });
  }, [colorPaletteMode, workspaceId]);

  // 팔레트 버튼 클릭 시 다음 팔레트 모드로 순환 전환
  const handleTogglePalette = () => {
    const modes: PaletteMode[] = ['vibrant', 'pastel', 'deep', 'soft', 'muted'];
    const currentIndex = modes.indexOf(colorPaletteMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setColorPaletteMode(nextMode);
  };

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

      // 키보드 표시 시 실제 보이는 화면 높이와 전체 화면 높이 비교
      const viewportHeight = visualViewport.height;
      const windowHeight = window.innerHeight;
      
      // 보이는 영역이 85% 미만으로 줄어들면 키보드가 올라온 것으로 판단
      if (viewportHeight < windowHeight * 0.85) {
        // 키보드 높이만큼 오프셋 계산하여 팝업을 위로 이동
        const keyboardHeight = windowHeight - viewportHeight;
        setKeyboardOffset(keyboardHeight);
      } else {
        // 키보드가 내려가면 팝업을 화면 중앙으로 재배치
        setKeyboardOffset(0);
      }
    };

    // 초기 실행으로 현재 상태 반영
    handleViewportResize();

    // visualViewport API를 지원하는 최신 모바일 브라우저에서만 동작
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
        window.visualViewport?.removeEventListener('scroll', handleViewportResize);
      };
    }
  }, [open]);

  // 카테고리 추가 요청 처리 - 유효성 검증 후 Edge Function을 통해 DB에 저장
  const handleSubmit = async (categoryName: string) => {
    // 빈 문자열이나 공백만 있는 경우 추가 방지
    if (!categoryName.trim()) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    setLoading(true);

    // Edge Function을 통해 카테고리 추가 (DB 로직은 Edge에서 처리)
    const { category, error } = await addCategory({
      workspaceId,
      name: categoryName,
      color: selectedColor,
    });

    // 추가 실패 시 에러 메시지 표시
    if (error || !category) {
      toast.error(error || '카테고리 추가에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 추가 성공 후 입력 필드 초기화 및 다음 사용 가능한 색상으로 자동 설정
    toast.success('카테고리가 추가되었습니다!');
    setName('');
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
