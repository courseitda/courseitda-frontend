import {useNavigate} from 'react-router-dom';
import {motion, useReducedMotion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {CircleHelp, Compass, FolderTree, Layers, MapPinned, Route, Search, Share2, Sparkles, Workflow} from 'lucide-react';
import {useAuthStore} from '@/shared/stores/auth-store';
import UserMenu from '@/components/header/user-menu';
import HeroAnimation from '@/components/landing/hero-animation';
import logo from '@/assets/logo-no-background.png';

const problems = [
    {
        title: '분산된 정보',
        description: '지도 즐겨찾기, 메모, 채팅에 흩어진 장소를 한 곳에서 체계적으로 관리하기 어렵습니다.',
        icon: Layers,
    },
    {
        title: '장소 탐색 피로도',
        description: '내 취향에 맞는 코스 정보를 찾기 위해 여러 플랫폼을 오가며 탐색해야 합니다.',
        icon: Search,
    },
    {
        title: '복잡한 코스 선정 과정',
        description: '장소를 찾은 뒤에도 순서 정리와 동선 확인까지 직접 하려면 시간이 오래 걸립니다.',
        icon: Route,
    },
] as const;

const features = [
    {
        title: '커뮤니티 탐색과 저장',
        description: '다른 사용자가 공유한 카테고리를 둘러보고, 마음에 드는 카테고리를 내 보관함에 모을 수 있습니다.',
        icon: Search,
    },
    {
        title: '커스텀 코스 제작',
        description: '카테고리 순서를 편집하고 대표 장소를 정해, 완벽한 일정을 만들 수 있습니다.',
        icon: FolderTree,
    },
    {
        title: '지도 기반 시각화',
        description: '카테고리별 색상 마커와 대표 장소 경로로 동선을 한눈에 확인할 수 있습니다.',
        icon: Compass,
    },
    {
        title: '공유와 재사용',
        description: '내가 만들어둔 카테고리를 재사용하거나 공유할 수 있습니다.',
        icon: Share2,
    },
] as const;

const steps = [
    // UserRequest: "이렇게 사용해요" 단계를 커뮤니티 기반 간편 시작 흐름(발견→가져오기→커스텀→공유)으로 재구성한다.
    {
        number: '01',
        title: '커뮤니티에서 카테고리를 찾습니다',
        description: '다른 사용자가 공유한 카테고리를 둘러보고, 원하는 카테고리를 고릅니다.',
    },
    {
        number: '02',
        title: '워크스페이스로 가져옵니다',
        description: '고른 카테고리를 내 워크스페이스 일정으로 불러와 바로 사용합니다.',
    },
    {
        number: '03',
        title: '필요한 만큼만 커스텀합니다',
        description: '카테고리 순서를 편집하고 대표 장소를 설정해 일정 흐름을 정리합니다.',
    },
    {
        number: '04',
        title: '완성한 카테고리를 다시 공유합니다',
        description: '내가 다듬은 카테고리를 공유해 다른 사용자도 쉽게 코스를 시작할 수 있습니다.',
    },
] as const;

// 랜딩 페이지 메인 컴포넌트
const Index = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const shouldReduceMotion = useReducedMotion();
    const interactiveHover = shouldReduceMotion ? undefined : {y: -6, transition: {duration: 0.2}};
    const interactiveTap = shouldReduceMotion ? undefined : {scale: 0.985};

    // UserRequest: your-journey-planner 랜딩과 동일한 섹션 흐름과 문구/애니메이션 흐름을 적용하되 프로젝트 색상 토큰으로 구현한다.
    // UserRequest: 랜딩 문구를 실제 서비스 기능(워크스페이스/내 보관함/커뮤니티/지도 코스 편집)이 드러나도록 정돈한다.
    // UserRequest: 랜딩 전반에 버튼/카드 중심 마이크로 인터랙션과 reduced-motion 대응을 추가한다.
    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-20 border-b border-border/50 bg-background/85 backdrop-blur">
                <div className="container mx-auto px-4 py-4 md:py-3">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                        <div className="w-10"/>
                        <div className="flex items-center justify-center gap-1.5 md:gap-2">
                            <img src={logo} alt="코스잇다 로고" className="h-10 w-10 rounded-lg object-contain"/>
                            <span className="whitespace-nowrap text-lg font-bold text-primary">코스잇다</span>
                        </div>
                        <div className="flex items-center justify-end">
                            <UserMenu/>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full pb-10 md:pb-12">
                <section
                    className="relative overflow-hidden border-b border-border/60 px-4 pb-12 pt-10 md:px-10 md:pb-16 md:pt-14">
                    <div
                        className="absolute inset-0 bg-[radial-gradient(120%_100%_at_95%_0%,hsl(var(--primary)/0.2),transparent_55%),radial-gradient(70%_80%_at_0%_100%,hsl(var(--accent-foreground)/0.12),transparent_50%)]"/>
                    <div className="relative z-10">
                        <motion.h1
                            initial={{opacity: 0, y: 18}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.1}}
                            className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl"
                        >
                            {/* UserRequest: 랜딩 최상단 문구를 3줄 카피(시작/마무리/코스잇다)로 교체한다. */}
                            시작은 간편하게
                            <br/>
                            마무리는 완벽하게
                            <br/>
                            <span className="text-primary">코스잇다</span>에서!
                        </motion.h1>

                        <motion.p
                            initial={{opacity: 0, y: 18}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.2}}
                            className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base"
                        >
                            {/* UserRequest: 랜딩 보조 문구를 카테고리 선택 기반의 간편 시작 메시지로 교체한다. */}
                            처음부터 고민하지 말고, 필요한 카테고리만 골라 간편하게 시작하세요.
                        </motion.p>

                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.3}}
                            className="mt-7 flex flex-col gap-3 sm:flex-row"
                        >
                            {isAuthenticated ? (
                                <>
                                    <Button
                                        size="lg"
                                        // UserRequest: 내 워크스페이스 이동 버튼의 텍스트를 버튼 정중앙에 고정한다.
                                        // UserRequest: 시작하기/내 워크스페이스 이동 버튼의 화살표 아이콘을 제거한다.
                                        className="justify-center sm:min-w-48 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/45"
                                        onClick={() => navigate('/my-workspaces')}
                                    >
                                        내 워크스페이스로 이동
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="sm:min-w-48 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/45"
                                        onClick={() => navigate('/community')}
                                    >
                                        커뮤니티 둘러보기
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        size="lg"
                                        className="justify-center sm:min-w-40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/45"
                                        onClick={() => navigate('/auth?tab=register')}
                                    >
                                        시작하기
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="sm:min-w-40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/45"
                                        onClick={() => navigate('/community')}
                                    >
                                        커뮤니티 둘러보기
                                    </Button>
                                </>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{opacity: 0, scale: 0.96}}
                            animate={{opacity: 1, scale: 1}}
                            whileHover={shouldReduceMotion ? undefined : {scale: 1.01}}
                            transition={{duration: 0.6, delay: 0.35}}
                            className="mt-8"
                        >
                            <HeroAnimation/>
                        </motion.div>
                    </div>
                </section>

                <section className="border-b border-border/60 px-4 py-12 md:px-6 md:py-16">
                    <motion.h2
                        initial={{opacity: 0, y: 14}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, amount: 0.3}}
                        className="flex items-center gap-2 text-2xl font-bold"
                    >
                        {/* UserRequest: 섹션 제목 앞에 주제별 아이콘을 배치해 정보 구분을 강화한다. */}
                        <CircleHelp className="h-6 w-6 text-primary"/>
                        이런 고민, 있지 않나요?
                    </motion.h2>
                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                        {problems.map((item, index) => (
                            <motion.article
                                key={item.title}
                                initial={{opacity: 0, x: -20}}
                                whileInView={{opacity: 1, x: 0}}
                                whileHover={interactiveHover}
                                whileTap={interactiveTap}
                                viewport={{once: true, amount: 0.2}}
                                transition={{duration: 0.4, delay: index * 0.1}}
                                className="rounded-2xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md focus-within:border-primary/35 focus-within:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                                        <item.icon className="h-5 w-5"/>
                                    </div>
                                    <h3 className="text-base font-semibold">{item.title}</h3>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </section>

                <section className="border-b border-border/60 bg-accent/70 px-4 py-12 md:px-6 md:py-16">
                    <motion.h2
                        initial={{opacity: 0, y: 14}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, amount: 0.3}}
                        className="flex items-center gap-2 text-2xl font-bold"
                    >
                        <Sparkles className="h-6 w-6 text-primary"/>
                        핵심 기능
                    </motion.h2>
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {features.map((feature, index) => (
                            <motion.article
                                key={feature.title}
                                initial={{opacity: 0, y: 16}}
                                whileInView={{opacity: 1, y: 0}}
                                whileHover={interactiveHover}
                                whileTap={interactiveTap}
                                viewport={{once: true, amount: 0.2}}
                                transition={{duration: 0.4, delay: index * 0.08}}
                                className="rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md focus-within:border-primary/35 focus-within:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <feature.icon className="h-5 w-5"/>
                                    </div>
                                    <h3 className="text-base font-semibold">{feature.title}</h3>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </section>

                <section className="border-b border-border/60 px-4 py-12 md:px-6 md:py-16">
                    <motion.h2
                        initial={{opacity: 0, y: 14}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, amount: 0.3}}
                        className="flex items-center gap-2 text-2xl font-bold"
                    >
                        <Workflow className="h-6 w-6 text-primary"/>
                        이렇게 사용해요
                    </motion.h2>

                    <div className="relative mt-8">
                        <div className="absolute left-5 top-6 h-[calc(100%-3rem)] w-px bg-border"/>
                        <div className="space-y-6">
                            {steps.map((step, index) => (
                                <motion.article
                                    key={step.number}
                                    initial={{opacity: 0, x: -14}}
                                    whileInView={{opacity: 1, x: 0}}
                                    whileHover={interactiveHover}
                                    viewport={{once: true, amount: 0.25}}
                                    transition={{duration: 0.4, delay: index * 0.1}}
                                    className="relative flex items-start gap-4"
                                >
                                    <div
                                        className="z-10 inline-flex h-10 w-10 shrink-0 aspect-square items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                        {step.number}
                                    </div>
                                    <div
                                        className="rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
                                        <h3 className="text-sm font-semibold">{step.title}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Index;
