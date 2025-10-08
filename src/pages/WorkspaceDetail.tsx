import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/mock/db';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Button } from '@/components/ui/button';
import { CategoryList } from '@/features/categories/category-list';
import { MapCanvas } from '@/features/map/map-canvas';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, Check, Plus, LayoutGrid, User as UserIcon, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreateWorkspaceDialog } from '@/features/workspaces/create-workspace-dialog';
import type { Place } from '@/entities/types';

const WorkspaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const kakaoJsApiKey = useSettingsStore((state) => state.kakaoJsApiKey);
  const kakaoRestApiKey = useSettingsStore((state) => state.kakaoRestApiKey);
  const [focusedPlace, setFocusedPlace] = useState<Place | null>(null);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const workspace = useLiveQuery(() => (id ? db.workspaces.get(id) : undefined), [id]);

  const categories = useLiveQuery(
    () => (id ? db.categories.where('workspaceId').equals(id).sortBy('sortOrder') : []),
    [id]
  );

  const workspaces = useLiveQuery(
    () => (user ? db.workspaces.where('ownerId').equals(user.id).toArray() : []),
    [user]
  );

  useEffect(() => {
    if (!kakaoJsApiKey || !kakaoRestApiKey) {
      toast.info('Kakao API 키를 설정해주세요.', {
        action: {
          label: '설정하기',
          onClick: () => navigate('/settings'),
        },
      });
    }
  }, [kakaoJsApiKey, kakaoRestApiKey, navigate]);

  const handleSelectWorkspace = (workspaceId: string) => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!workspace || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>워크스페이스를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-card flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur z-20 shrink-0">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* Left: Back Button */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/workspaces')}
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Center: Workspace Title */}
            <div className="flex justify-center items-center min-w-0 relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:opacity-70 transition-opacity">
                    <div className="flex items-center gap-1">
                      <h1 className="text-lg font-bold truncate max-w-[200px] md:max-w-[400px]">
                        {workspace.title}
                      </h1>
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  <div className="max-h-[180px] overflow-y-auto">
                    {workspaces?.map((ws) => (
                      <DropdownMenuItem
                        key={ws.id}
                        onClick={() => handleSelectWorkspace(ws.id)}
                        className={`cursor-pointer justify-center font-semibold ${
                          ws.id === workspace.id 
                            ? 'bg-primary/10' 
                            : ''
                        }`}
                      >
                        <span className="truncate">{ws.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-1 pb-1">
                    <button
                      onClick={() => setCreateWorkspaceOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-sm rounded-sm border border-dashed border-border hover:bg-accent transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      새 워크스페이스
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Right: Profile Menu */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-10">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <UserIcon className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">{user.nickname}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.nickname}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/mypage')} className="gap-2">
                    <UserIcon className="w-4 h-4" />
                    마이페이지
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/workspaces')} className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    워크스페이스
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2">
                    <Settings className="w-4 h-4" />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2">
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile: Map fixed top, Categories scrollable / Desktop: Side by side */}
      <main className="flex-1 min-h-0">
        <div className="container mx-auto px-4 h-full">
          <div className="h-full py-2.5 md:py-4 flex flex-col md:grid md:grid-cols-2 gap-2.5 md:gap-4">
            {/* Map Section - Fixed on mobile, normal on desktop */}
            <div className="h-[calc((100vh-64px)*0.45)] md:h-full rounded-xl overflow-hidden border border-border/50 shadow-lg bg-card shrink-0">
              {kakaoJsApiKey ? (
                <MapCanvas workspaceId={workspace.id} categories={categories || []} focusedPlace={focusedPlace} />
              ) : (
                <div className="h-full flex items-center justify-center p-6 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      지도를 표시하려면 Kakao API 키를 설정해주세요.
                    </p>
                    <Button size="sm" onClick={() => navigate('/settings')}>
                      설정하기
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Categories Section - Scrollable on mobile, normal on desktop */}
            <div className="flex-1 md:h-full overflow-y-auto rounded-xl border border-border/50 bg-card p-4 min-h-0">
              <CategoryList 
                workspaceId={workspace.id} 
                categories={categories || []} 
                onPlaceClick={setFocusedPlace}
              />
            </div>
          </div>
        </div>
      </main>

      <CreateWorkspaceDialog 
        open={createWorkspaceOpen} 
        onOpenChange={setCreateWorkspaceOpen} 
      />
    </div>
  );
};

export default WorkspaceDetail;
