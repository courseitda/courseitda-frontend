import type { Dispatch, SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { communityApi } from '@/services/api';
import type { SharedSavedCategory } from '@/entities/types';
import { COMMUNITY_QUERY_KEYS } from '@/shared/hooks/use-community';
import { MESSAGES } from '@/shared/constants/messages';

type ToggleLikeParams = {
  sharedCategoryId: string;
  currentLiked: boolean;
};

type UseSharedCategoryLikeParams = {
  queryKey: readonly unknown[];
  token: string | null;
  isAuthenticated: boolean;
  setSelectedCategory?: Dispatch<SetStateAction<SharedSavedCategory | null>>;
  onRequireLogin?: () => void;
};

// UserRequest: 공유 카테고리 찜 토글 로직을 공통 훅으로 분리
export const useSharedCategoryLike = ({
  queryKey,
  token,
  isAuthenticated,
  setSelectedCategory,
  onRequireLogin,
}: UseSharedCategoryLikeParams) => {
  const queryClient = useQueryClient();

  const toggleLikeMutation = useMutation({
    mutationFn: async (params: { sharedCategoryId: string; nextLiked: boolean }) => {
      if (!token) {
        throw new Error(MESSAGES.common.authTokenRequired);
      }

      const response = params.nextLiked
        ? await communityApi.likeSharedCategory(token, params.sharedCategoryId)
        : await communityApi.unlikeSharedCategory(token, params.sharedCategoryId);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.common.defaultError);
      }

      return response.data;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<SharedSavedCategory[]>(queryKey);
      queryClient.setQueryData<SharedSavedCategory[]>(queryKey, (old) =>
        (old ?? []).map((category) =>
          category.id === params.sharedCategoryId ? { ...category, liked: params.nextLiked } : category,
        ),
      );

      if (setSelectedCategory) {
        setSelectedCategory((previousSelected) =>
          previousSelected && previousSelected.id === params.sharedCategoryId
            ? { ...previousSelected, liked: params.nextLiked }
            : previousSelected,
        );
      }

      return { previous };
    },
    onError: (error, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      const message = error instanceof Error ? error.message : MESSAGES.common.defaultError;
      toast.error(message);
    },
    onSuccess: (data) => {
      toast[data.isLiked ? 'success' : 'info'](
        data.isLiked ? '찜했어요. 내 보관함에서 확인할 수 있습니다.' : '찜을 해제했습니다.',
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      // UserRequest: 찜 목록 조회 API 추가에 맞춰 찜한 카테고리 목록 캐시도 동기화
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.liked });
    },
  });

  const toggleLike = ({ sharedCategoryId, currentLiked }: ToggleLikeParams) => {
    // UserRequest: 로그인 필요 안내를 토스트 대신 안내창으로 유도
    if (!isAuthenticated) {
      if (onRequireLogin) {
        onRequireLogin();
        return false;
      }
      toast.error(MESSAGES.common.loginRequiredForFeature);
      return false;
    }
    if (!token) {
      toast.error(MESSAGES.common.authTokenRequired);
      return false;
    }
    if (toggleLikeMutation.isPending) {
      return false;
    }

    toggleLikeMutation.mutate({ sharedCategoryId, nextLiked: !currentLiked });
    return true;
  };

  return { toggleLike, isPending: toggleLikeMutation.isPending };
};
