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
import { Search, MapPin } from 'lucide-react';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { placeApi } from '@/services/api';
import { useAuthStore } from '@/shared/stores/auth-store';
import { MESSAGES } from '@/shared/constants/messages';
import type { SearchedPlace } from '@/entities/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PlaceSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  workspaceIdentifier: string;
}

// 장소 검색 다이얼로그 - Naver Places API 응답을 활용하여 장소를 검색하고 카테고리에 추가
// 사용 위치: features/categories/category-card
export const PlaceSearchDialog = ({
  open,
  onOpenChange,
  categoryId,
  workspaceIdentifier,
}: PlaceSearchDialogProps) => {
  const token = useAuthStore((state) => state.token); // 인증 토큰 추출
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];

  // API 서비스 레이어를 통해 장소 검색 수행 (백엔드 연동 시 placeApi.search만 수정)
  const handleSearch = async () => {
    // 빈 검색어 입력 방지
    if (!query.trim()) {
      toast.error(MESSAGES.place.searchKeywordRequired);
      return;
    }

    setLoading(true);

    // API 서비스 레이어를 통해 장소 검색 요청
    const { searchedPlaces, error } = await placeApi.search({
      keyword: query,
    });

    if (error) {
      toast.error(error || MESSAGES.place.searchFailed);
      setResults([]);
    } else if (searchedPlaces) {
      setResults(searchedPlaces);
      
      // 검색 결과가 없을 경우 안내
      if (searchedPlaces.length === 0) {
        toast.info(MESSAGES.place.searchNoResult);
      }
    }

    setLoading(false);
  };

  // 검색된 장소를 카테고리에 추가
  const addPlaceMutation = useMutation({
    mutationFn: async (payload: { place: SearchedPlace; token: string }) => {
      const { place, token } = payload;

      const response = await placeApi.addToCategory(token, categoryId, {
        name: place.name,
        placeUrl: place.placeUrl,
        roadAddressName: place.roadAddressName,
        addressName: place.addressName,
        lat: place.latitude,
        lng: place.longitude,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || MESSAGES.place.addFailed);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(MESSAGES.place.addSuccess);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.place.addFailed;
      toast.error(message);
    },
    onSettled: () => {
      setAdding(null);
    },
  });

  const handleAdd = (place: SearchedPlace) => {
    if (!token) {
      toast.error(MESSAGES.common.loginRequired);
      return;
    }

    if (addPlaceMutation.isPending) return;

    setAdding(place.id);
    addPlaceMutation.mutate({ place, token });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col overflow-y-auto px-3 py-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{MESSAGES.place.searchDialogTitle}</DialogTitle>
          {/* UserRequest: 검색 제공자 혼선을 방지하기 위해 안내 문구를 중립적으로 변경한다. */}
          <DialogDescription>{MESSAGES.place.searchDialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 min-h-0 flex-1">
          {/* 고정된 검색 영역 */}
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
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
            <Button onClick={handleSearch} disabled={loading} className="shrink-0 gap-2 px-3">
              <Search className="w-4 h-4" />
              검색
            </Button>
          </div>

          {/* 스크롤 가능한 결과 영역 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading && (
              <div className="py-8 text-center text-muted-foreground">{MESSAGES.workspaceCategory.searching}</div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2 pr-2">
                {results.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-1 truncate text-sm font-medium sm:text-base">{place.name}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{place.addressName}</span>
                          </div>
                          {place.roadAddressName && (
                            <div className="text-xs truncate">{place.roadAddressName}</div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0"
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
