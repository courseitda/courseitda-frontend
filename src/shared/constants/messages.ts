// 공통 메시지 카탈로그 - 화면별 하드코딩을 줄이고 톤/문구 일관성을 유지
const common = {
  authTokenRequired: '인증 토큰이 필요합니다.',
  retry: '새로고침',
  loading: '불러오는 중...',
  loginRequired: '로그인이 필요합니다.',
  loginRequiredForFeature: '로그인 후 이용할 수 있는 기능입니다.',
  loginRequiredDialogTitle: '로그인이 필요해요',
  loginRequiredDialogDescription: '해당 기능을 이용하시려면 먼저 로그인해주세요.',
  defaultError: '요청 처리 중 오류가 발생했습니다.',
} as const;

const auth = {
  loginFailed: '로그인에 실패했습니다.',
  loginSuccess: '로그인 성공',
  registerFailed: '회원가입에 실패했습니다.',
  registerSuccess: '회원가입이 완료되었습니다',
  autoLoginFailed: '자동 로그인에 실패했습니다. 다시 로그인해주세요.',
  nicknameCheckFailed: '닉네임 확인 중 오류가 발생했습니다.',
  emailCheckFailed: '이메일 확인 중 오류가 발생했습니다.',
  nicknameLoadFailed: '닉네임을 불러올 수 없습니다.',
  userInfoLoadFailed: '사용자 정보를 불러올 수 없습니다.',
} as const;

const workspace = {
  createFailed: '워크스페이스 생성에 실패했습니다.',
  createSuccess: '워크스페이스가 생성되었습니다',
  updateFailed: '워크스페이스 수정에 실패했습니다.',
  updateSuccess: '워크스페이스가 수정되었습니다',
  deleteFailed: '워크스페이스 삭제에 실패했습니다.',
  deleteSuccess: '워크스페이스가 삭제되었습니다',
  titleRequired: '워크스페이스 제목을 입력해주세요.',
  loadFailed: '워크스페이스 목록을 불러오지 못했습니다.',
  notFound: '워크스페이스를 찾을 수 없습니다.',
  identifierRequired: '워크스페이스 식별자가 필요합니다.',
  deleteConfirmTitle: '워크스페이스 삭제',
  deleteConfirmDescription: (title: string) =>
    `"${title}" 워크스페이스를 정말 삭제하시겠습니까?`,
  deleteConfirmWarning: '이 작업은 되돌릴 수 없으며, 모든 카테고리와 장소 정보가 함께 삭제됩니다.',
  createDialogTitle: '새 워크스페이스',
  editDialogTitle: '워크스페이스 이름 바꾸기',
  titleDuplicateCheckFailed: '워크스페이스 제목 중복 확인에 실패했습니다.',
} as const;

// UserRequest: 페이지 분리 없이 카테고리 메시지를 공유/보관/찜/워크스페이스로 나누어 관리
// 공유 카테고리: 커뮤니티 노출/검색/업로드/내 게시물 삭제
const sharedCategory = {
  fetchDetailFailed: '공유 카테고리를 불러올 수 없습니다.',
  myPostsLoadFailed: '커뮤니티 관리 정보를 불러오지 못했습니다.',
  deleteFailed: '공유 카테고리 삭제에 실패했습니다.',
  deleteSuccess: '공유 카테고리를 삭제했어요.',
  deleteConfirmTitle: '게시물을 삭제할까요?',
  deleteConfirmDescription: (title: string) =>
    `"${title}" 게시물을 삭제합니다.`,
  deleteConfirmWarning: '삭제 후에는 복구할 수 없습니다.',
  uploadDialogTitle: '카테고리 업로드',
  uploadFailed: '카테고리 업로드에 실패했습니다.',
  uploadSuccess: '커뮤니티에 업로드했어요.',
  uploadEmpty: '업로드할 카테고리가 없습니다. 내 카테고리에서 먼저 만들어주세요.',
  recommendedLoadFailed: '추천 카테고리를 불러올 수 없습니다.',
  searchLoadFailed: '검색 결과를 불러올 수 없습니다.',
} as const;

// 보관 카테고리: 내 카테고리(생성/수정/삭제/검색/상세)
const savedCategory = {
  addDialogTitle: '카테고리 추가',
  editDialogTitle: '카테고리 수정',
  addFailed: '카테고리 추가에 실패했습니다.',
  addSuccess: '카테고리가 추가되었습니다',
  updateFailed: '카테고리 수정에 실패했습니다.',
  updateSuccess: '카테고리가 수정되었습니다',
  deleteFailed: '카테고리 삭제에 실패했습니다.',
  deleteSuccess: '카테고리가 삭제되었습니다',
  listLoadFailed: '내 카테고리를 불러오지 못했습니다.',
  noSavedCategories: '내 보관함에 카테고리가 없습니다.',
  searchKeywordRequired: '검색어를 입력해주세요.',
  searchNoResult: '검색 결과가 없습니다.',
  placeAlreadyAdded: '이미 추가된 장소입니다.',
  nameRequired: '카테고리 이름을 입력해주세요.',
  atLeastOnePlace: '장소를 1개 이상 추가해주세요.',
  deleteConfirmTitle: '카테고리 삭제',
  deleteConfirmDescription: (title: string) =>
    `"${title}" 카테고리를 정말 삭제하시겠습니까?`,
  deleteConfirmWarning: '이 작업은 되돌릴 수 없으며, 카테고리에 포함된 장소 정보도 함께 삭제됩니다.',
  noPlacesInDetail: '표시할 장소가 없습니다.',
  noPlacesSelected: '선택한 장소가 없습니다.',
} as const;

// 찜 카테고리: 찜 목록 조회/찜 해제 확인
const likedCategory = {
  listLoadFailed: '찜한 카테고리를 불러오지 못했습니다.',
  noLikedCategories: '찜한 카테고리가 없습니다.',
  unlikeConfirmTitle: '찜을 해제할까요?',
  unlikeConfirmDescription: (title: string) =>
    `"${title}"를 찜 목록에서 제거합니다.`,
} as const;

// 워크스페이스 카테고리: 워크스페이스에 속한 카테고리(추가/수정/정렬/불러오기)
const workspaceCategory = {
  addDialogTitle: '카테고리 추가',
  editDialogTitle: '카테고리 수정',
  listLoadFailed: '카테고리 목록을 불러오지 못했습니다.',
  reorderFailed: '카테고리 순서 변경에 실패했습니다.',
  importDialogTitle: '카테고리 불러오기',
  importFailed: '카테고리 불러오기에 실패했습니다.',
  importSuccess: '카테고리를 불러왔습니다.',
  placeImportFailed: '장소 불러오기에 실패했습니다.',
  searching: '검색 중...',
} as const;

const place = {
  addFailed: '장소 추가에 실패했습니다.',
  addSuccess: '장소가 추가되었습니다',
  removeFailed: '장소 삭제에 실패했습니다.',
  removeSuccess: '장소가 삭제되었습니다',
  representativeFailed: '대표 장소 설정에 실패했습니다.',
  linkMissing: '장소 링크가 없습니다.',
  searchDialogTitle: '장소 검색',
  searchDialogDescription: '장소를 검색하고 추가하세요',
  searchKeywordRequired: '검색어를 입력해주세요.',
  searchNoResult: '검색 결과가 없습니다.',
  searchFailed: '장소 검색에 실패했습니다.',
} as const;

const map = {
  browserLocationUnsupported: '이 브라우저에서는 위치 정보를 지원하지 않습니다.',
  mapNotReady: '지도가 아직 준비되지 않았습니다.',
  locationPermissionDenied: '위치 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.',
  locationFetchFailed: '현재 위치를 가져오지 못했습니다. 다시 시도해주세요.',
} as const;

export const MESSAGES = {
  common,
  auth,
  workspace,
  sharedCategory,
  savedCategory,
  likedCategory,
  workspaceCategory,
  place,
  map,

  // 하위 호환: 기존 참조 키 유지
  community: {
    fetchDetailFailed: sharedCategory.fetchDetailFailed,
    myPostsLoadFailed: sharedCategory.myPostsLoadFailed,
    deleteFailed: sharedCategory.deleteFailed,
    deleteSuccess: sharedCategory.deleteSuccess,
    deleteConfirmTitle: sharedCategory.deleteConfirmTitle,
    deleteConfirmDescription: sharedCategory.deleteConfirmDescription,
    deleteConfirmWarning: sharedCategory.deleteConfirmWarning,
    uploadDialogTitle: sharedCategory.uploadDialogTitle,
    uploadFailed: sharedCategory.uploadFailed,
    uploadSuccess: sharedCategory.uploadSuccess,
    uploadEmpty: sharedCategory.uploadEmpty,
    recommendedLoadFailed: sharedCategory.recommendedLoadFailed,
    searchLoadFailed: sharedCategory.searchLoadFailed,
  },
  category: {
    addDialogTitle: workspaceCategory.addDialogTitle,
    editDialogTitle: workspaceCategory.editDialogTitle,
    addFailed: savedCategory.addFailed,
    addSuccess: savedCategory.addSuccess,
    updateFailed: savedCategory.updateFailed,
    updateSuccess: savedCategory.updateSuccess,
    deleteFailed: savedCategory.deleteFailed,
    deleteSuccess: savedCategory.deleteSuccess,
    listLoadFailed: savedCategory.listLoadFailed,
    reorderFailed: workspaceCategory.reorderFailed,
    importDialogTitle: workspaceCategory.importDialogTitle,
    importFailed: workspaceCategory.importFailed,
    importSuccess: workspaceCategory.importSuccess,
    placeImportFailed: workspaceCategory.placeImportFailed,
    noSavedCategories: savedCategory.noSavedCategories,
    noLikedCategories: likedCategory.noLikedCategories,
    searchKeywordRequired: savedCategory.searchKeywordRequired,
    searchNoResult: savedCategory.searchNoResult,
    placeAlreadyAdded: savedCategory.placeAlreadyAdded,
    nameRequired: savedCategory.nameRequired,
    atLeastOnePlace: savedCategory.atLeastOnePlace,
    likedListLoadFailed: likedCategory.listLoadFailed,
    unlikeConfirmTitle: likedCategory.unlikeConfirmTitle,
    unlikeConfirmDescription: likedCategory.unlikeConfirmDescription,
    deleteConfirmTitle: savedCategory.deleteConfirmTitle,
    deleteConfirmDescription: savedCategory.deleteConfirmDescription,
    deleteConfirmWarning: savedCategory.deleteConfirmWarning,
    noPlacesInDetail: savedCategory.noPlacesInDetail,
    noPlacesSelected: savedCategory.noPlacesSelected,
    searching: workspaceCategory.searching,
  },
} as const;
