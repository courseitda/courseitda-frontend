// 데이터베이스 시드 기능 비활성화 - 사용자가 직접 회원가입해야 함
// 테스트 계정 자동 생성을 방지하여 보안성 향상

export const seedDatabase = async () => {
  // 시드 비활성화 - 사용자는 반드시 회원가입 필요
  console.log('Database seeding disabled. Please register a new account.');
};

// 자동 시드 실행 비활성화 - 브라우저 환경에서도 시드하지 않음
if (typeof window !== 'undefined') {
  seedDatabase().catch(console.error);
}
