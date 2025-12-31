import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Plus, Folder, Heart, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { useMySavedCategories } from '@/shared/hooks/use-my-storage';
import type { SavedCategory } from '@/entities/types';
import PageHeader from '@/components/layout/page-header';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useNaverLoader } from '@/shared/hooks/use-naver-loader';
import { PlaceInfoWindow } from '@/features/map/place-info-window';

type SavedCategoryMapProps = {
  open: boolean;
  places: SavedCategory['places'];
  focusedPlaceId: string | null;
};

// UserRequest: 내 보관함 카테고리 팝업 지도도 공유 카테고리 팝업과 동일한 동작/표기를 적용
const SavedCategoryMap = ({ open, places, focusedPlaceId }: SavedCategoryMapProps) => {
  const naverMapKeyId = useSettingsStore((state) => state.naverMapKeyId);
  const { ready, error } = useNaverLoader(naverMapKeyId);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const markerMapRef = useRef<
    Map<
      string,
      { marker: naver.maps.Marker; position: naver.maps.LatLng; openInfoWindow: () => void }
    >
  >(new Map());
  const currentInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  useEffect(() => {
    // UserRequest: 팝업이 열리고 SDK 로딩 완료 시에만 지도 초기화
    if (!open || !ready || !mapRef.current || !window.naver || !window.naver.maps || mapInstanceRef.current) {
      return;
    }

    const { naver } = window;
    const firstPlace = places[0];
    const initialCenter = firstPlace
      ? new naver.maps.LatLng(firstPlace.latitude, firstPlace.longitude)
      : new naver.maps.LatLng(37.5665, 126.9780);

    mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 13,
    });

    // 지도 클릭 시 열려있는 정보창 닫기 - 사용자 경험 개선
    const handleMapClick = () => {
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
    };

    const clickListener = naver.maps.Event.addListener(mapInstanceRef.current, 'click', handleMapClick);

    return () => {
      naver.maps.Event.removeListener(clickListener);
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
    };
  }, [open, ready, places]);

  useEffect(() => {
    // UserRequest: 장소 좌표를 지도 마커로 반영
    if (!open || !ready || !mapInstanceRef.current || !window.naver || !window.naver.maps) return;

    const { naver } = window;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    markerMapRef.current.clear();
    if (currentInfoWindowRef.current) {
      currentInfoWindowRef.current.close();
      currentInfoWindowRef.current = null;
    }

    const validPlaces = places.filter(
      (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
    );

    if (validPlaces.length === 0) {
      // UserRequest: 좌표가 없을 때 기본 중심 좌표로 이동
      map.panTo(new naver.maps.LatLng(37.5665, 126.9780));
      map.setZoom(13);
      return;
    }

    const bounds = new naver.maps.LatLngBounds();

    validPlaces.forEach((place) => {
      const position = new naver.maps.LatLng(place.latitude, place.longitude);
      const marker = new naver.maps.Marker({
        position,
        map,
        // UserRequest: 공유 카테고리 팝업과 동일한 붉은 물방울 마커 적용
        icon: {
          content: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: #ef4444;
              border: 2px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            "></div>
          `,
          anchor: new naver.maps.Point(12, 24),
        },
      });
      markersRef.current.push(marker);

      // UserRequest: 워크스페이스 상세보기와 동일한 스타일의 InfoWindow 사용
      const createInfoWindowElement = () => {
        const container = document.createElement('div');
        const root = createRoot(container);
        flushSync(() => {
          root.render(
            <PlaceInfoWindow
              placeName={place.name}
              isRepresentative={false}
              onToggleRepresentative={() => undefined}
              showRepresentativeAction={false}
            />,
          );
        });
        return container;
      };

      const openInfoWindow = () => {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
          currentInfoWindowRef.current = null;
        }

        const infoWindow = new naver.maps.InfoWindow({
          content: createInfoWindowElement(),
          borderWidth: 0,
          backgroundColor: 'transparent',
          // UserRequest: InfoWindow와 마커 간격을 좁혀 시각적 연결감 강화
          pixelOffset: new naver.maps.Point(0, -26),
          disableAnchor: true,
        });
        infoWindow.open(map, marker);
        currentInfoWindowRef.current = infoWindow;
      };

      markerMapRef.current.set(place.id, {
        marker,
        position,
        openInfoWindow,
      });
      bounds.extend(position);
    });

    // UserRequest: 팝업 진입 시 지도 레이아웃을 먼저 갱신한 후 모든 마커가 보이도록 bounds 적용
    naver.maps.Event.trigger(map, 'resize');
    map.fitBounds(bounds);
  }, [open, ready, places]);

  useEffect(() => {
    // UserRequest: 장소 클릭 시 해당 마커를 중앙으로 이동하고 InfoWindow 표시
    if (!open || !ready || !mapInstanceRef.current || !window.naver || !window.naver.maps) return;
    if (!focusedPlaceId) return;

    const target = markerMapRef.current.get(focusedPlaceId);
    if (!target) return;

    const map = mapInstanceRef.current;

    map.panTo(target.position);
    setTimeout(() => {
      map.setZoom(14);
    }, 300);
    setTimeout(() => {
      target.openInfoWindow();
    }, 350);
  }, [open, ready, focusedPlaceId]);

  useEffect(() => {
    // 팝업 닫힘 시 지도 인스턴스와 마커 참조를 정리하여 누수 방지
    if (!open) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      markerMapRef.current.clear();
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
      mapInstanceRef.current = null;
    }
  }, [open]);

  if (!naverMapKeyId || error) {
    return (
      <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground text-center px-6">
        네이버 지도 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
        지도 로딩 중...
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-96 rounded-lg border border-border overflow-hidden" />;
};

/**
 * 내 카테고리 페이지 컴포넌트
 * 카테고리/찜 탭만 제공하며 워크스페이스 탭을 노출하지 않음
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const MyCategory = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  // UserRequest: 내 카테고리 페이지에서는 카테고리/찜 탭만 제공하고 카테고리 탭을 기본값으로 설정
  const [activeSection, setActiveSection] = useState<'categories' | 'liked'>('categories');
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SavedCategory | null>(null);
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);

  // UserRequest: 내 카테고리 목록은 service 계층 API + React Query로 로딩 (컴포넌트 내부 mock 제거)
  const {
    data: savedCategories = [],
    isLoading: savedCategoriesLoading,
    error: savedCategoriesError,
  } = useMySavedCategories(token);

  // 미인증 사용자 접근 차단 - 로그인 페이지로 리다이렉트하여 보안 유지
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // UserRequest: 카테고리 카드 클릭 시 상세 팝업을 표시하여 이름/지도(임시)/장소 목록을 보여줌
  const handleOpenCategory = (categoryId: string) => {
    const target = savedCategories.find((category) => category.id === categoryId);
    if (!target) return;
    setSelectedCategory(target);
    // UserRequest: 팝업 재진입 시 이전 선택 상태를 초기화
    setFocusedPlaceId(null);
    setCategoryDetailOpen(true);
  };

  useEffect(() => {
    // UserRequest: 내 카테고리 목록 조회 실패 시 사용자에게 즉시 알림
    if (savedCategoriesError) {
      toast.error(savedCategoriesError.message);
    }
  }, [savedCategoriesError]);

  if (savedCategoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (savedCategoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">내 카테고리를 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-card">
        {/* UserRequest: 뒤로가기 버튼은 직전 페이지로 이동 */}
        {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
        <PageHeader title="내 카테고리" />

        {/* 모바일 레이아웃 */}
        {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
        <main className="md:hidden container mx-auto px-4 py-6">
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'categories' | 'liked')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              {/* UserRequest: 워크스페이스 탭을 제거하고 카테고리/찜 탭만 노출 */}
              <TabsTrigger value="categories" className="flex items-center gap-1.5">
                <Folder className="w-4 h-4" />
                카테고리
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                찜
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="mt-0 space-y-3">
              {/* UserRequest: 카테고리 탭에서도 생성 버튼과 목록을 워크스페이스와 동일한 형태로 표시 */}
              <Card
                  className="border-dashed hover-lift cursor-pointer"
                  onClick={() => toast.info('카테고리 생성은 API 연동 후 제공됩니다.')}
              >
                <CardHeader className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="w-5 h-5" />
                    <CardTitle className="text-base md:text-lg text-primary">새 카테고리</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">API 연동 후 카테고리를 추가할 수 있습니다.</p>
                </CardHeader>
              </Card>

              {savedCategories.map((category) => (
                  <Card
                      key={category.id}
                      className="hover-lift cursor-pointer"
                      onClick={() => handleOpenCategory(category.id)}
                  >
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                          <Folder className="w-4 h-4" />
                        </div>
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                      {category.placeCount}
                    </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base truncate">{category.title}</CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          수정: {new Date(category.updatedAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        </p>
                      </div>
                    </CardHeader>
                  </Card>
              ))}
            </TabsContent>

            <TabsContent value="liked" className="mt-0">
              <div className="text-sm text-muted-foreground">찜 목록은 준비 중입니다.</div>
            </TabsContent>
          </Tabs>
        </main>

        {/* 데스크톱 레이아웃 - 3단 구조 */}
        {/* UserRequest: 데스크톱 화면에서도 카테고리/찜 탭만 제공하여 정보 구조를 단순화 */}
        <main className="hidden md:block min-h-[calc(100vh-80px)]">
          <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
            {/* 좌측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

            {/* 중앙: 카테고리/찜 목록 콘텐츠 */}
            <div className="px-4 py-4 overflow-y-auto min-h-[calc(100vh-80px)]">
              <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'categories' | 'liked')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="categories" className="flex items-center gap-1.5">
                    <Folder className="w-4 h-4" />
                    카테고리
                  </TabsTrigger>
                  <TabsTrigger value="liked" className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    찜
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="mt-0 space-y-2">
                  {/* UserRequest: 카테고리 탭에서도 생성 버튼과 목록을 워크스페이스와 동일한 형태로 표시 */}
                  <Card
                      className="border-dashed hover-lift cursor-pointer"
                      onClick={() => toast.info('카테고리 생성은 API 연동 후 제공됩니다.')}
                  >
                    <CardHeader className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-primary">
                        <Plus className="w-5 h-5" />
                        <CardTitle className="text-base md:text-lg text-primary">새 카테고리</CardTitle>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">API 연동 후 카테고리를 추가할 수 있습니다.</p>
                    </CardHeader>
                  </Card>

                  {savedCategories.map((category) => (
                      <Card
                          key={category.id}
                          className="hover-lift cursor-pointer"
                          onClick={() => handleOpenCategory(category.id)}
                      >
                        <CardHeader className="flex flex-row items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                              <Folder className="w-4 h-4" />
                            </div>
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                          {category.placeCount}
                        </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <CardTitle className="text-base truncate">{category.title}</CardTitle>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              수정: {new Date(category.updatedAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            </p>
                          </div>
                        </CardHeader>
                      </Card>
                  ))}
                </TabsContent>

                <TabsContent value="liked" className="mt-0">
                  <div className="text-sm text-muted-foreground">찜 목록은 준비 중입니다.</div>
                </TabsContent>
              </Tabs>
            </div>

            {/* 우측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>
          </div>
        </main>

        <Dialog open={categoryDetailOpen} onOpenChange={setCategoryDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-center">{selectedCategory?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <SavedCategoryMap
                open={categoryDetailOpen}
                places={selectedCategory?.places ?? []}
                focusedPlaceId={focusedPlaceId}
              />
              <div className="space-y-2">
                <p className="text-sm font-semibold">장소 목록</p>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {selectedCategory?.places.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => setFocusedPlaceId(place.id)}
                        className="w-full text-left p-3 flex flex-col gap-1 hover:bg-accent/40 transition-colors"
                      >
                        <span className="text-sm font-medium">{place.name}</span>
                        <span className="text-xs text-muted-foreground">{place.addressName}</span>
                      </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default MyCategory;
