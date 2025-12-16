import { useEffect, useState } from 'react';
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
import { Plus, Folder, Heart, ArrowLeft, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserMenu from '@/components/header/user-menu';

/**
 * 내 카테고리 페이지 컴포넌트
 * 카테고리/찜 탭만 제공하며 워크스페이스 탭을 노출하지 않음
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const MyCategory = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  // UserRequest: 내 카테고리 페이지에서는 카테고리/찜 탭만 제공하고 카테고리 탭을 기본값으로 설정
  const [activeSection, setActiveSection] = useState<'categories' | 'liked'>('categories');
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    title: string;
    color: string;
    updatedAt: string;
    placeCount: number;
    places: { id: string; name: string; address: string }[];
  } | null>(null);

  // 미인증 사용자 접근 차단 - 로그인 페이지로 리다이렉트하여 보안 유지
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // 임시 데이터: 카테고리 API 연동 후 실제 데이터로 대체 필요
  const mockCategories = [
    {
      id: 'cat-1',
      title: '점심 맛집',
      color: '#4F46E5',
      updatedAt: new Date().toISOString(),
      placeCount: 12,
      places: [
        { id: 'p-1', name: '봉추찜닭 강남점', address: '서울시 강남구 테헤란로 123' },
        { id: 'p-2', name: '멘야하나비', address: '서울시 강남구 역삼로 45' },
      ],
    },
    {
      id: 'cat-2',
      title: '카페 탐방',
      color: '#10B981',
      updatedAt: new Date().toISOString(),
      placeCount: 8,
      places: [
        { id: 'p-3', name: '어니언 안국', address: '서울시 종로구 율곡로 83' },
        { id: 'p-4', name: '펠트 한남', address: '서울시 용산구 대사관로 35' },
      ],
    },
    {
      id: 'cat-3',
      title: '산책 코스',
      color: '#F59E0B',
      updatedAt: new Date().toISOString(),
      placeCount: 5,
      places: [
        { id: 'p-5', name: '서울숲', address: '서울시 성동구 뚝섬로 273' },
        { id: 'p-6', name: '반포 한강공원', address: '서울시 서초구 신반포로 11길 40' },
      ],
    },
  ];

  // UserRequest: 카테고리 카드 클릭 시 상세 팝업을 표시하여 이름/지도(임시)/장소 목록을 보여줌
  const handleOpenCategory = (categoryId: string) => {
    const target = mockCategories.find((category) => category.id === categoryId);
    if (!target) return;
    setSelectedCategory(target);
    setCategoryDetailOpen(true);
  };

  return (
      <div className="min-h-screen bg-gradient-card">
        <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 md:py-3">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              {/* UserRequest: 헤더 좌측에 뒤로가기 버튼을 배치해 워크스페이스 상세 페이지와 일관된 네비게이션 제공 */}
              <div className="flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/')}
                    aria-label="뒤로가기"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>

              {/* UserRequest: 헤더 중앙에 현재 위치를 명확히 표시하기 위해 제목을 추가 */}
              <div className="flex justify-center items-center">
                <h1 className="text-lg font-semibold">내 카테고리</h1>
              </div>

            <div className="flex items-center">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

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

              {mockCategories.map((category) => (
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

                  {mockCategories.map((category) => (
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
              {/* UserRequest: 지도 영역은 임시 영역으로 마련 (실제 Naver Maps 연동 시 대체 필요) */}
            <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
              지도 영역 (임시)
            </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">장소 목록</p>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {selectedCategory?.places.map((place) => (
                      <div key={place.id} className="p-3 flex flex-col gap-1">
                        <span className="text-sm font-medium">{place.name}</span>
                        <span className="text-xs text-muted-foreground">{place.address}</span>
                      </div>
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
