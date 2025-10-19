import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * 로컬 개발 서버를 자동으로 시작하고 테스트 후 종료
 */
export default defineConfig({
  // 테스트 파일 위치
  testDir: './tests-ui',
  
  // 테스트 실행 최대 시간 (30초)
  timeout: 30 * 1000,
  
  // 각 expect 문의 타임아웃 (5초)
  expect: {
    timeout: 5000
  },
  
  // 테스트 실행 설정
  fullyParallel: false, // 순차 실행으로 테스트 간 간섭 방지
  forbidOnly: !!process.env.CI, // CI 환경에서는 .only 사용 금지
  retries: process.env.CI ? 2 : 0, // CI 환경에서는 실패 시 2번 재시도
  workers: 1, // 단일 워커로 순차 실행
  
  // 테스트 리포터 설정
  reporter: 'html',
  
  // 모든 테스트에서 공통으로 사용할 설정
  use: {
    // 각 액션(클릭, 타이핑 등)의 타임아웃
    actionTimeout: 10 * 1000,
    
    // 베이스 URL - 모든 테스트에서 navigate('/') 형태로 사용 가능
    baseURL: 'http://localhost:3000',
    
    // 실패 시 스크린샷 캡처
    screenshot: 'only-on-failure',
    
    // 실패 시 비디오 저장
    video: 'retain-on-failure',
    
    // 모든 액션과 네트워크 요청 추적
    trace: 'on-first-retry',
  },

  // 테스트할 브라우저 및 기기 설정
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // 모바일 테스트 (필요 시 주석 해제)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // 로컬 개발 서버 자동 시작
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 서버 시작 대기 시간 (2분)
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

