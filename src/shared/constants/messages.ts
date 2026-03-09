// 공통 메시지 카탈로그 - 서버 응답 기반 성공/실패 메시지만 관리
const common = {
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
  loadFailed: '워크스페이스 목록을 불러오지 못했습니다.',
  titleDuplicateCheckFailed: '워크스페이스 제목 중복 확인에 실패했습니다.',
} as const;

// UserRequest: 페이지 분리 없이 카테고리 메시지를 공유/보관/워크스페이스로 나누어 관리
// 공유 카테고리: 커뮤니티 노출/검색/업로드/내 게시물 삭제
const sharedCategory = {
  fetchDetailFailed: '공유 카테고리를 불러올 수 없습니다.',
  myPostsLoadFailed: '커뮤니티 관리 정보를 불러오지 못했습니다.',
  deleteFailed: '공유 카테고리 삭제에 실패했습니다.',
  deleteSuccess: '공유 카테고리를 삭제했어요.',
  uploadFailed: '카테고리 업로드에 실패했습니다.',
  uploadSuccess: '커뮤니티에 업로드했어요.',
  recommendedLoadFailed: '추천 카테고리를 불러올 수 없습니다.',
  searchLoadFailed: '검색 결과를 불러올 수 없습니다.',
} as const;

// 보관 카테고리: 내 카테고리(생성/수정/삭제)
const savedCategory = {
  addFailed: '카테고리 추가에 실패했습니다.',
  addSuccess: '카테고리가 추가되었습니다',
  updateFailed: '카테고리 수정에 실패했습니다.',
  updateSuccess: '카테고리가 수정되었습니다',
  deleteFailed: '카테고리 삭제에 실패했습니다.',
  deleteSuccess: '카테고리가 삭제되었습니다',
  listLoadFailed: '내 카테고리를 불러오지 못했습니다.',
} as const;

// 워크스페이스 카테고리: 워크스페이스에 속한 카테고리(정렬/불러오기)
const workspaceCategory = {
  listLoadFailed: '카테고리 목록을 불러오지 못했습니다.',
  reorderFailed: '카테고리 순서 변경에 실패했습니다.',
  importFailed: '카테고리 불러오기에 실패했습니다.',
  importSuccess: '카테고리를 불러왔습니다.',
  placeImportFailed: '장소 불러오기에 실패했습니다.',
} as const;

const place = {
  addFailed: '장소 추가에 실패했습니다.',
  addSuccess: '장소가 추가되었습니다',
  removeFailed: '장소 삭제에 실패했습니다.',
  removeSuccess: '장소가 삭제되었습니다',
  representativeFailed: '대표 장소 설정에 실패했습니다.',
  searchFailed: '장소 검색에 실패했습니다.',
} as const;

export const MESSAGES = {
  common,
  auth,
  workspace,
  sharedCategory,
  savedCategory,
  workspaceCategory,
  place,
} as const;
