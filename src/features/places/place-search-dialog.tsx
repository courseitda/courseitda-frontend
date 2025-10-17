import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Phone, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { searchPlaces } from '@/shared/lib/kakao';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { placeApi } from '@/services/api';
import { useSettingsStore } from '@/shared/stores/settings-store';
import type { KakaoPlace } from '@/entities/types';

interface PlaceSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  workspaceId: string;
}

// 장소 검색 다이얼로그 - Kakao Local API를 사용하여 장소를 검색하고 카테고리에 추가
// 사용 위치: features/categories/category-card
export const PlaceSearchDialog = ({
  open,
  onOpenChange,
  categoryId,
  workspaceId,
}: PlaceSearchDialogProps) => {
  const kakaoRestApiKey = useSettingsStore((state) => state.kakaoRestApiKey);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  // Kakao Local API를 통해 장소 검색 수행
  const handleSearch = async () => {
    // API 키 미설정 시 사용자에게 안내
    if (!kakaoRestApiKey) {
      toast.error('Kakao REST API 키를 설정해주세요.');
      return;
    }

    // 빈 검색어 입력 방지
    if (!query.trim()) {
      toast.error('검색어를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // Kakao REST API로 장소 검색 요청
      const data = await searchPlaces(query, kakaoRestApiKey);
      setResults(data.documents);

      // 검색 결과가 없을 경우 안내
      if (data.documents.length === 0) {
        toast.info('검색 결과가 없습니다.');
      }
    } catch (error) {
      toast.error('장소 검색에 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 검색된 장소를 카테고리에 추가
  const handleAdd = async (place: KakaoPlace) => {
    setAdding(place.id);

    // API 서비스 레이어를 통해 장소를 카테고리에 연결 (백엔드 연동 시 placeApi만 수정)
    const { error } = await placeApi.addToCategory({
      workspaceId,
      categoryId,
      kakaoPlace: place,
    });

    if (error) {
      toast.error(error);
    } else {
      toast.success('장소가 추가되었습니다!');
    }

    setAdding(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>장소 검색</DialogTitle>
          <DialogDescription>Kakao 지도에서 장소를 검색하고 추가하세요</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 min-h-0 flex-1">
          {/* 고정된 검색 영역 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="장소 이름이나 주소 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="gap-2">
              <Search className="w-4 h-4" />
              검색
            </Button>
          </div>

          {/* 스크롤 가능한 결과 영역 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">검색 중...</div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2 pr-2">
                {results.map((place) => (
                  <div
                    key={place.id}
                    className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1">{place.place_name}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{place.address_name}</span>
                          </div>
                          {place.road_address_name && (
                            <div className="text-xs truncate">{place.road_address_name}</div>
                          )}
                          {place.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{place.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAdd(place)}
                        disabled={adding === place.id}
                      >
                        {adding === place.id ? '추가 중...' : '추가'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
