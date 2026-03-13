import {useNavigate} from 'react-router-dom';
import {motion, useReducedMotion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {CircleHelp, Compass, FolderTree, Layers, MapPinned, Route, Search, Share2, Sparkles, Workflow} from 'lucide-react';
import {useAuthStore} from '@/shared/stores/auth-store';
import PageHeader from '@/components/layout/page-header';
import HeroAnimation from '@/components/landing/hero-animation';
import { UI_COPY } from '@/shared/constants/ui-copy';

const problems = [
    {
        title: UI_COPY.landing.problems[0].title,
        description: UI_COPY.landing.problems[0].description,
        icon: Layers,
    },
    {
        title: UI_COPY.landing.problems[1].title,
        description: UI_COPY.landing.problems[1].description,
        icon: Search,
    },
    {
        title: UI_COPY.landing.problems[2].title,
        description: UI_COPY.landing.problems[2].description,
        icon: Route,
    },
] as const;

const features = [
    {
        title: UI_COPY.landing.features[0].title,
        description: UI_COPY.landing.features[0].description,
        icon: Search,
    },
    {
        title: UI_COPY.landing.features[1].title,
        description: UI_COPY.landing.features[1].description,
        icon: FolderTree,
    },
    {
        title: UI_COPY.landing.features[2].title,
        description: UI_COPY.landing.features[2].description,
        icon: Compass,
    },
    {
        title: UI_COPY.landing.features[3].title,
        description: UI_COPY.landing.features[3].description,
        icon: Share2,
    },
] as const;

const steps = [
    // UserRequest: "이렇게 사용해요" 단계를 커뮤니티 기반 간편 시작 흐름(발견→가져오기→커스텀→공유)으로 재구성한다.
    {
        number: UI_COPY.landing.steps[0].number,
        title: UI_COPY.landing.steps[0].title,
        description: UI_COPY.landing.steps[0].description,
    },
    {
        number: UI_COPY.landing.steps[1].number,
        title: UI_COPY.landing.steps[1].title,
        description: UI_COPY.landing.steps[1].description,
    },
    {
        number: UI_COPY.landing.steps[2].number,
        title: UI_COPY.landing.steps[2].title,
        description: UI_COPY.landing.steps[2].description,
    },
    {
        number: UI_COPY.landing.steps[3].number,
        title: UI_COPY.landing.steps[3].title,
        description: UI_COPY.landing.steps[3].description,
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
            {/* UserRequest: 랜딩 페이지 헤더도 공통 헤더로 통일 (좌측 로고, 우측 햄버거) */}
            <PageHeader className="z-30" />

            <main className="w-full pb-10 md:pb-12">
                <section
                    className="relative overflow-hidden border-b border-border/60 px-8 pb-12 pt-10 md:px-12 md:pb-16 md:pt-14">
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
                            {UI_COPY.landing.hero.line1}
                            <br/>
                            {UI_COPY.landing.hero.line2}
                            <br/>
                            <span className="text-primary">{UI_COPY.landing.hero.brand}</span>{UI_COPY.landing.hero.suffix}
                        </motion.h1>

                        <motion.p
                            initial={{opacity: 0, y: 18}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.2}}
                            className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base"
                        >
                            {/* UserRequest: 랜딩 보조 문구를 카테고리 선택 기반의 간편 시작 메시지로 교체한다. */}
                            {UI_COPY.landing.hero.description}
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
                                        {UI_COPY.landing.hero.moveToWorkspace}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="sm:min-w-48 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/45"
                                        onClick={() => navigate('/community')}
                                    >
                                        {UI_COPY.landing.hero.exploreCommunity}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        size="lg"
                                        className="justify-center sm:min-w-40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/45"
                                        onClick={() => navigate('/auth?tab=register')}
                                    >
                                        {UI_COPY.landing.hero.start}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="sm:min-w-40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/45"
                                        onClick={() => navigate('/community')}
                                    >
                                        {UI_COPY.landing.hero.exploreCommunity}
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

                <section className="border-b border-border/60 px-8 py-12 md:px-10 md:py-16">
                    <motion.h2
                        initial={{opacity: 0, y: 14}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, amount: 0.3}}
                        className="flex items-center gap-2 text-2xl font-bold"
                    >
                        {/* UserRequest: 섹션 제목 앞에 주제별 아이콘을 배치해 정보 구분을 강화한다. */}
                        <CircleHelp className="h-6 w-6 text-primary"/>
                        {UI_COPY.landing.problemsTitle}
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

                <section className="border-b border-border/60 bg-accent/70 px-8 py-12 md:px-10 md:py-16">
                    <motion.h2
                        initial={{opacity: 0, y: 14}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, amount: 0.3}}
                        className="flex items-center gap-2 text-2xl font-bold"
                    >
                        <Sparkles className="h-6 w-6 text-primary"/>
                        {UI_COPY.landing.featuresTitle}
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

                <section className="border-b border-border/60 px-8 py-12 md:px-10 md:py-16">
                    <motion.h2
                        initial={{opacity: 0, y: 14}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, amount: 0.3}}
                        className="flex items-center gap-2 text-2xl font-bold"
                    >
                        <Workflow className="h-6 w-6 text-primary"/>
                        {UI_COPY.landing.stepsTitle}
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
