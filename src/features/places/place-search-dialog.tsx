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
import { Search, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { placeApi } from '@/services/api';
import { useAuthStore } from '@/shared/stores/auth-store';
import type { KakaoPlace } from '@/entities/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PlaceSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  workspaceIdentifier: string;
}

// 장소 검색 다이얼로그 - Kakao Local API를 사용하여 장소를 검색하고 카테고리에 추가
// 사용 위치: features/categories/category-card
export const PlaceSearchDialog = ({
  open,
  onOpenChange,
  categoryId,
  workspaceIdentifier,
}: PlaceSearchDialogProps) => {
  const token = useAuthStore((state) => state.token); // 인증 토큰 추출
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];

  // API 서비스 레이어를 통해 장소 검색 수행 (백엔드 연동 시 placeApi.search만 수정)
  const handleSearch = async () => {
    // 빈 검색어 입력 방지
    if (!query.trim()) {
      toast.error('검색어를 입력해주세요.');
      return;
    }

    setLoading(true);

    // API 서비스 레이어를 통해 장소 검색 요청
    const { searchedPlaces, error } = await placeApi.search({
      keyword: query,
    });

    if (error) {
      toast.error(error);
      setResults([]);
    } else if (searchedPlaces) {
      setResults(searchedPlaces);
      
      // 검색 결과가 없을 경우 안내
      if (searchedPlaces.length === 0) {
        toast.info('검색 결과가 없습니다.');
      }
    }

    setLoading(false);
  };

  // 검색된 장소를 카테고리에 추가
  const addPlaceMutation = useMutation({
    mutationFn: async (payload: { place: KakaoPlace; token: string }) => {
      const { place, token } = payload;

      const response = await placeApi.addToCategory(token, categoryId, {
        name: place.place_name,
        roadAddressName: place.road_address_name || null,
        addressName: place.address_name,
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '장소 추가에 실패했습니다.');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('장소가 추가되었습니다!');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '장소 추가에 실패했습니다.';
      toast.error(message);
    },
    onSettled: () => {
      setAdding(null);
    },
  });

  const handleAdd = (place: KakaoPlace) => {
    if (!token) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (addPlaceMutation.isPending) return;

    setAdding(place.id);
    addPlaceMutation.mutate({ place, token });
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
