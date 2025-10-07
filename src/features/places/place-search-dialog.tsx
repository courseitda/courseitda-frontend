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
import { addPlaceToCategory } from '@/mock/edge-functions/place';
import { useSettingsStore } from '@/shared/stores/settings-store';
import type { KakaoPlace } from '@/entities/types';

interface PlaceSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  workspaceId: string;
}

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

  const handleSearch = async () => {
    if (!kakaoRestApiKey) {
      toast.error('Kakao REST API 키를 설정해주세요.');
      return;
    }

    if (!query.trim()) {
      toast.error('검색어를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const data = await searchPlaces(query, kakaoRestApiKey);
      setResults(data.documents);

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

  const handleAdd = async (place: KakaoPlace) => {
    setAdding(place.id);

    const { error } = await addPlaceToCategory({
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>장소 검색</DialogTitle>
          <DialogDescription>Kakao 지도에서 장소를 검색하고 추가하세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {loading && (
            <div className="text-center py-8 text-muted-foreground">검색 중...</div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
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
      </DialogContent>
    </Dialog>
  );
};
