import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo-no-background.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUserDropdown, useUserNickname } from '@/shared/hooks/use-user-info';
import { toast } from 'sonner';
import { ArrowLeft, Heart, Archive, LogOut, Search, User as UserIcon, Folder, Calendar, MapPin } from 'lucide-react';

type SharedCategory = {
  id: string;
  title: string;
  uploader: string;
  uploadedAt: string;
  liked: boolean;
  placeCount: number;
  places: { id: string; name: string; address: string }[];
};

// 임시 데이터: 공유 카테고리 검색/찜 API 연동 후 대체 필요
const mockSharedCategories: SharedCategory[] = [
  {
    id: 'shared-1',
    title: '잠실 점심 식당',
    uploader: 'lucas',
    uploadedAt: new Date().toISOString(),
    liked: false,
    placeCount: 8,
    places: [
      { id: 'p-1', name: '을지로 을지면옥', address: '서울 중구 을지로 14길 29' },
      { id: 'p-2', name: '윤씨밀방', address: '서울 마포구 와우산로 66' },
      { id: 'p-3', name: '마포진짜원조최모리곰탕', address: '서울 마포구 만리재옛길 45' },
    ],
  },
  {
    id: 'shared-2',
    title: '건대 카페',
    uploader: 'selena',
    uploadedAt: new Date().toISOString(),
    liked: true,
    placeCount: 12,
    places: [
      { id: 'p-4', name: '어니언 한남', address: '서울 용산구 대사관로 35' },
      { id: 'p-5', name: '펠트 안국', address: '서울 종로구 윤보선길 29' },
      { id: 'p-6', name: '웨이브온 커피', address: '경기 성남시 분당구 불정로 76' },
    ],
  },
  {
    id: 'shared-3',
    title: '한강 산책 코스',
    uploader: 'hana',
    uploadedAt: new Date().toISOString(),
    liked: false,
    placeCount: 5,
    places: [
      { id: 'p-7', name: '뚝섬 한강공원', address: '서울 광진구 강변북로 139' },
      { id: 'p-8', name: '반포 한강공원', address: '서울 서초구 신반포로11길 40' },
      { id: 'p-9', name: '이촌 한강공원', address: '서울 용산구 이촌동 302-14' },
    ],
  },
];

const SearchResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, logout } = useAuthStore();
  const { nickname: navNickname } = useUserNickname(); // 네비게이터용 닉네임
  const { nickname: dropdownNickname, email } = useUserDropdown(); // 드롭다운용 닉네임 + 이메일
  const initialKeyword = searchParams.get('keyword') || '';
  const [inputKeyword, setInputKeyword] = useState(initialKeyword);
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [sharedCategories, setSharedCategories] = useState<SharedCategory[]>(mockSharedCategories);
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<SharedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 검색어에 따라 공유 카테고리 필터링
  const filteredCategories = useMemo(() => {
    const value = searchKeyword.trim().toLowerCase();
    if (!value) return sharedCategories;
    return sharedCategories.filter((category) => category.title.toLowerCase().includes(value));
  }, [searchKeyword, sharedCategories]);

  // UserRequest: 공유 카테고리 찜하기는 토글로 구현 (임시 상태, API 연동 필요)
  const handleToggleLike = (id: string) => {
    if (!isAuthenticated) {
      toast.error('로그인 후 이용할 수 있는 기능입니다.');
      return;
    }
    setSharedCategories((prev) =>
      prev.map((category) => {
        if (category.id === id) {
          const nextLiked = !category.liked;
          toast[nextLiked ? 'success' : 'info'](
            nextLiked ? '찜했어요. 내 보관함에서 확인할 수 있습니다.' : '찜을 해제했습니다.',
          );
          return { ...category, liked: nextLiked };
        }
        return category;
      }),
    );
    setLikePulse((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setLikePulse((prev) => ({ ...prev, [id]: false }));
    }, 200);
  };

  // UserRequest: 검색 버튼으로 제목 검색 실행 (무한 스크롤은 API 연동 후 구현)
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputKeyword.trim();
    setSearchKeyword(value);
    navigate(`/community/search${value ? `?keyword=${encodeURIComponent(value)}` : ''}`);
    toast.message('검색 결과는 임시 데이터입니다. (API 연동 필요)');
  };

  // UserRequest: 카드 클릭 시 상세 팝업을 띄워 공유 카테고리 정보를 보여줌 (임시 데이터 기반)
  const handleOpenDetail = (category: SharedCategory) => {
    setSelectedCategory(category);
    setDetailOpen(true);
  };

  // 로그아웃 처리 후 인증 상태 초기화
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
              <img src={logo} alt="코스잇다 로고" className="w-10 h-10 object-contain rounded-lg" />
              <span className="font-bold text-lg whitespace-nowrap text-primary">코스잇다</span>
            </div>

            <div className="flex items-center">
              {isAuthenticated && navNickname ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 h-10">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <UserIcon className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline font-medium">{navNickname}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{dropdownNickname}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/mypage')} className="gap-2">
                      <UserIcon className="w-4 h-4" />
                      마이페이지
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/workspaces')} className="gap-2">
                      <Archive className="w-4 h-4" />
                      내 보관함
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2">
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/auth')}>로그인</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <section className="space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-row gap-3 items-stretch">
              <div className="flex-1 flex gap-2">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={inputKeyword}
                    onChange={(event) => setInputKeyword(event.target.value)}
                    placeholder="잠실 점심 식당, 건대 카페"
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="gap-2">
                <Search className="w-4 h-4" />
                검색
              </Button>
            </form>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">검색 결과</h2>
              <span className="text-xs text-muted-foreground">
                {filteredCategories.length}개
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="hover-lift cursor-pointer"
                  onClick={() => handleOpenDetail(category)}
                >
                  <CardHeader className="flex flex-row items-center gap-3 py-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                        <Folder className="w-4 h-4" />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                        {category.placeCount}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{category.title}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4 text-primary" />
                        {category.uploader}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!isAuthenticated) {
                          toast.error('로그인 후 이용할 수 있는 기능입니다.');
                          return;
                        }
                        handleToggleLike(category.id);
                      }}
                      aria-label={`${category.title} 찜하기`}
                      aria-pressed={category.liked}
                      className={`relative h-11 w-11 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-90 focus:outline-none ${likePulse[category.id] ? 'scale-110' : ''}`}
                    >
                      {likePulse[category.id] && (
                        <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      )}
                      <Heart
                        className={`w-7 h-7 ${isAuthenticated ? 'text-primary' : 'text-muted-foreground'} transition-transform duration-150 ${likePulse[category.id] ? 'scale-110' : ''}`}
                        fill={isAuthenticated && category.liked ? 'currentColor' : 'none'}
                        strokeWidth={isAuthenticated && category.liked ? 0 : 1.5}
                      />
                    </button>
                  </CardHeader>
                </Card>
              ))}
            </div>
      </section>
    </div>
  </main>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{selectedCategory?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-primary" />
                {selectedCategory?.uploader}
              </span>
              {selectedCategory?.uploadedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {new Date(selectedCategory.uploadedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            {/* UserRequest: 보관함 카테고리 상세 다이얼로그와 동일한 구조로 지도/장소 목록 표시 (지도는 임시 영역) */}
            <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
              지도 영역 (임시)
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                장소 목록
                {selectedCategory?.placeCount !== undefined && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({selectedCategory.placeCount}곳)
                  </span>
                )}
              </p>
              <div className="border border-border rounded-lg divide-y divide-border">
                {selectedCategory?.places.map((place) => (
                  <div key={place.id} className="p-3 flex flex-col gap-1">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      {place.name}
                    </span>
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

export default SearchResult;
