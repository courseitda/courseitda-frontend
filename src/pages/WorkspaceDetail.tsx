import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/mock/db';
import { useAuthStore } from '@/shared/stores/auth-store';
import { CategoryList } from '@/features/categories/category-list';
import { MapCanvas } from '@/features/map/map-canvas';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { toast } from 'sonner';
import { NavigationDrawer } from '@/features/layout/navigation-drawer';
import type { Place } from '@/entities/types';

const WorkspaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const kakaoJsApiKey = useSettingsStore((state) => state.kakaoJsApiKey);
  const kakaoRestApiKey = useSettingsStore((state) => state.kakaoRestApiKey);
  const [focusedPlace, setFocusedPlace] = useState<Place | null>(null);

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
          onClick: () => navigate('/mypage'),
        },
      });
    }
  }, [kakaoJsApiKey, kakaoRestApiKey, navigate]);

  const handleSelectWorkspace = (workspaceId: string) => {
    navigate(`/workspace/${workspaceId}`);
  };

  if (!workspace || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>워크스페이스를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-20 shrink-0">
        <div className="container mx-auto px-8 md:px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            {/* Left: Navigation */}
            <div className="flex items-center">
              <NavigationDrawer
                workspaces={workspaces || []}
                currentWorkspaceId={workspace.id}
                onSelectWorkspace={handleSelectWorkspace}
                user={user}
              />
            </div>
            
            {/* Center: Workspace Title */}
            <div className="text-center min-w-0 flex items-center justify-center">
              <h1 className="text-lg font-bold truncate">{workspace.title}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile: Map top, Categories bottom / Desktop: Side by side */}
      <main className="flex-1 container mx-auto px-8 md:px-4 py-8 md:py-4 overflow-hidden">
        <div className="h-full flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-4">
          {/* Map Section - Always on top on mobile */}
          <div className="h-[512px] md:h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-border/50 shadow-lg bg-card order-1">
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

          {/* Categories Section - Below map on mobile */}
          <div className="flex-1 md:h-[calc(100vh-120px)] overflow-y-auto rounded-xl border border-border/50 bg-card p-8 md:p-4 order-2">
            <CategoryList 
              workspaceId={workspace.id} 
              categories={categories || []} 
              onPlaceClick={setFocusedPlace}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkspaceDetail;
