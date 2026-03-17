
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { apiBase } from "@/lib/api";

type Story = {
    id: string;
    headline: string;
    durationMs: number;
};

type Stage = "playing" | "empathy" | "completed";

const bubbleLayouts = [
    { align: "left", maxW: "72%" },
    { align: "left", maxW: "65%" },
    { align: "right", maxW: "70%" },
    { align: "right", maxW: "60%" },
    { align: "left", maxW: "78%" },
    { align: "left", maxW: "68%" },
    { align: "right", maxW: "80%" },
    { align: "left", maxW: "62%" },
    { align: "right", maxW: "74%" },
    { align: "right", maxW: "66%" },
];

export default function LandingPage() {
    const [stage, setStage] = useState<Stage>("playing");
    const [stories, setStories] = useState<Story[]>([]);
    const [visibleCount, setVisibleCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // fetch from DB
    useEffect(() => {
        fetch(`${apiBase}/api/onboarding/stories`)
            .then((r) => r.json())
            .then((data: Story[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    setStories(data);
                } else {
                    setStage("completed");
                }
            })
            .catch(() => {
                setStage("completed");
            });
    }, []);

    // drip bubbles in one by one
    useEffect(() => {
        if (stage !== "playing" || stories.length === 0) return;
        if (visibleCount >= stories.length) {
            const t = setTimeout(() => setStage("empathy"), 1200);
            return () => clearTimeout(t);
        }
        const delay = visibleCount === 0 ? 500 : (stories[visibleCount - 1]?.durationMs ?? 2000);
        const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
        return () => clearTimeout(t);
    }, [stage, visibleCount, stories]);

    // empathy → completed after pause
    useEffect(() => {
        if (stage !== "empathy") return;
        const t = setTimeout(() => setStage("completed"), 3500);
        return () => clearTimeout(t);
    }, [stage]);

    // auto-scroll as bubbles appear
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [visibleCount, stage]);

    const skip = () => setStage("completed");

    const primaryColor = `hsl(var(--ob-primary))`;

    return (
        <div
            className="min-h-screen flex flex-col relative overflow-hidden bg-white"
            style={{ fontFamily: `var(--ob-font)` }}
        >


            {/* ─── THOUGHT BUBBLES (scrollable) ─── */}
            {(stage === "playing" || stage === "empathy") && (
                <div className="flex flex-col h-screen" style={{ animation: "fade-in 0.4s both" }}>
                    {/* skip */}
                    {stage === "playing" && (
                        <div className="flex justify-end px-5 pt-4 pb-2">
                            <button
                                onClick={skip}
                                className="text-xs font-medium px-3 py-1.5 rounded-full text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Skip
                            </button>
                        </div>
                    )}

                    {/* scrollable thought area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
                        <div className="max-w-sm md:max-w-md mx-auto flex flex-col gap-4">
                            {stories.slice(0, visibleCount).map((story, i) => {
                                const layout = bubbleLayouts[i % bubbleLayouts.length];
                                return (
                                    <div
                                        key={story.id}
                                        className="flex"
                                        style={{
                                            justifyContent:
                                                layout.align === "left" ? "flex-start" :
                                                    layout.align === "right" ? "flex-end" : "center",
                                            animation: "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both",
                                        }}
                                    >
                                        <div
                                            className="px-5 py-3 text-[15px] leading-snug text-gray-700"
                                            style={{
                                                maxWidth: layout.maxW,
                                                borderRadius: "20px",
                                                background: "#f3f4f6",
                                            }}
                                        >
                                            {story.headline}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* typing dots */}
                            {stage === "playing" && visibleCount > 0 && visibleCount < stories.length && (
                                <div className="flex justify-start" style={{ animation: "fade-in 0.3s both" }}>
                                    <div
                                        className="px-4 py-3 flex gap-1.5"
                                        style={{ borderRadius: "20px", background: "#f3f4f6" }}
                                    >
                                        {[0, 1, 2].map((d) => (
                                            <div
                                                key={d}
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                    background: "#d1d5db",
                                                    animation: `float 1.2s ease-in-out ${d * 0.15}s infinite`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* empathy message */}
                            {stage === "empathy" && (
                                <div
                                    className="text-center pt-8 pb-4"
                                    style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}
                                >
                                    <p className="text-lg font-semibold mb-1 text-gray-900">
                                        If you've ever worried about your allowance running out...
                                    </p>
                                    <p className="text-base text-gray-400">
                                        you're not alone.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── AUTH CHOICE (white bg → smooth transition to onboarding) ─── */}
            {stage === "completed" && (
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-10 bg-white"
                    style={{ animation: "fade-in 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
                >
                    {/* icon */}
                    <div className="relative mb-7">
                        <div
                            className="absolute blur-3xl rounded-full opacity-10"
                            style={{
                                background: primaryColor,
                                width: 140, height: 140,
                                left: "50%", top: "50%",
                                transform: "translate(-50%, -50%)",
                            }}
                        />
                        <div
                            className="w-16 h-16 flex items-center justify-center relative z-10 overflow-hidden bg-white"
                            style={{
                                borderRadius: "var(--ob-radius-xl)",
                                boxShadow: `0 8px 40px hsl(var(--ob-primary) / 0.2)`,
                            }}
                        >
                            <img src="/icon.png" alt="StuFi Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
                        StuFi can help.
                    </h2>
                    <p className="text-center max-w-xs mb-10 leading-relaxed text-gray-500 text-[15px]">
                        Know exactly where your allowance goes and make it last the whole month.
                    </p>

                    <div className="w-full max-w-xs md:max-w-sm space-y-3" style={{ animation: "fade-up 0.5s 0.2s both" }}>
                        <Link href="/onboarding" className="block">
                            <button
                                className="w-full py-4 font-semibold text-base text-white transition-all active:scale-[0.98]"
                                style={{
                                    borderRadius: "var(--ob-radius-lg)",
                                    background: primaryColor,
                                    boxShadow: `0 4px 24px hsl(var(--ob-primary) / 0.2)`,
                                }}
                            >
                                Get started, it's free
                            </button>
                        </Link>

                        <Link href="/login" className="block">
                            <button
                                className="w-full py-4 font-medium text-base transition-all active:scale-[0.98]"
                                style={{
                                    borderRadius: "var(--ob-radius-lg)",
                                    border: `1px solid #e5e7eb`,
                                    color: "#374151",
                                }}
                            >
                                I already have an account
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
