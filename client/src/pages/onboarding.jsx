import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";
import { apiBase } from "@/lib/api";

// step definitions
const TOTAL_STEPS = 7;

// student-relevant spending categories
const regularCategories = [
    { id: "food", emoji: "\u{1F35A}", label: "Food" },
    { id: "transport", emoji: "\u{1F68C}", label: "Transport" },
    { id: "data", emoji: "\u{1F4F1}", label: "Data & Airtime" },
    { id: "books", emoji: "\u{1F4DA}", label: "Books & Supplies" },
    { id: "clothing", emoji: "\u{1F455}", label: "Clothing" },
    { id: "toiletries", emoji: "\u{1F9F4}", label: "Toiletries" },
];

const extraCategories = [
    { id: "entertainment", emoji: "\u{1F3AE}", label: "Entertainment" },
    { id: "savings", emoji: "\u{1F4B0}", label: "Savings" },
    { id: "health", emoji: "\u{1F48A}", label: "Health" },
    { id: "gifts", emoji: "\u{1F381}", label: "Gifts" },
    { id: "subscriptions", emoji: "\u{1F4CB}", label: "Subscriptions" },
    { id: "other", emoji: "\u{2728}", label: "Other" },
];

const frequencies = [
    { value: "weekly", label: "Every week" },
    { value: "biweekly", label: "Every 2 weeks" },
    { value: "monthly", label: "Once a month" },
    { value: "semester", label: "Per semester" },
];

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [, setLocation] = useLocation();
    const { login } = useAuth();

    // collected data
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("");
    const [selectedRegular, setSelectedRegular] = useState([]);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // browser back button support — keep steps in history
    useEffect(() => {
        window.history.replaceState({ step: 1 }, "");
    }, []);

    const goToStep = useCallback((newStep) => {
        if (newStep > step) {
            window.history.pushState({ step: newStep }, "");
        }
        setStep(newStep);
    }, [step]);

    useEffect(() => {
        const onPopState = (e) => {
            if (e.state?.step) {
                setStep(e.state.step);
            } else {
                setLocation("/landing");
            }
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [setLocation]);

    const progress = (step / TOTAL_STEPS) * 100;

    const canProceed = () => {
        switch (step) {
            case 1: return name.trim().length > 0;
            case 2: return parseFloat(amount) > 0;
            case 3: return frequency !== "";
            case 4: return selectedRegular.length > 0;
            case 5: return true; // extras are optional
            case 6: return email.includes("@") && password.length >= 8 && password === confirmPassword && calculateStrength(password) >= 2;
            default: return false;
        }
    };

    const calculateStrength = (pass) => {
        let score = 0;
        if (!pass) return score;
        if (pass.length >= 8) score += 1;
        if (pass.length >= 12) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return Math.min(4, score);
    };

    const strength = calculateStrength(password);
    const getStrengthColor = () => {
        if (strength === 0) return "bg-gray-200";
        if (strength === 1) return "bg-red-400";
        if (strength === 2) return "bg-yellow-400";
        if (strength === 3) return "bg-green-400";
        return "bg-green-500";
    };

    const getStrengthLabel = () => {
        if (!password) return "";
        if (strength === 1) return "Weak";
        if (strength === 2) return "Fair";
        if (strength === 3) return "Good";
        return "Strong";
    };

    const toggleCategory = (id, list, setList) => {
        setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError("");

        // gather selected category names
        const allCategories = [
            ...regularCategories.filter(c => selectedRegular.includes(c.id)),
            ...extraCategories.filter(c => selectedExtras.includes(c.id)),
        ].map(c => ({ name: c.label, emoji: c.emoji }));

        try {
            const res = await fetch(`${apiBase}/api/onboard`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    allowanceAmount: amount,
                    frequency,
                    categories: allCategories,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Something went wrong");
                setIsSubmitting(false);
                setStep(6); // go back to login step
                return;
            }

            // login the user
            login(data.user, data.token);

            // small delay for the "building" animation
            await new Promise(r => setTimeout(r, 2000));
            setLocation("/");
        } catch {
            setError("Network error. Please try again.");
            setIsSubmitting(false);
            setStep(6);
        }
    };

    const next = () => {
        if (step === 6) {
            goToStep(7);
            handleSubmit();
        } else if (step < TOTAL_STEPS) {
            goToStep(step + 1);
        }
    };

    const back = () => {
        if (step > 1) window.history.back();
        else setLocation("/landing");
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* top bar */}
            {step < 7 && (
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={back}
                            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex-1 onboarding-progress">
                            <div
                                className="onboarding-progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* step content */}
            <div className="flex-1 px-6 md:px-8 pb-32 max-w-lg mx-auto w-full">
                {/* step 1 — name */}
                {step === 1 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Let's Get Started
                        </h1>
                        <p className="text-gray-500 mb-8">What should we call you?</p>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your first name"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-base"
                            autoFocus
                        />
                    </div>
                )}

                {/* step 2 — allowance amount */}
                {step === 2 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            How Much Allowance Do You Get?
                        </h1>
                        <p className="text-gray-500 mb-8">Don't worry, you can always change this later.</p>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-base pointer-events-none">GH₵</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g. 500"
                                className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-base"
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* step 3 — frequency */}
                {step === 3 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            How Often Do You Receive It?
                        </h1>
                        <p className="text-gray-500 mb-8">This helps us set up your budget cycle.</p>
                        <div className="flex flex-col gap-3">
                            {frequencies.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFrequency(f.value)}
                                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-base font-medium ${frequency === f.value
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    {frequency === f.value && <Check className="w-5 h-5 inline mr-3" />}
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* step 4 — regular categories */}
                {step === 4 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            What Do You Regularly Spend On?
                        </h1>
                        <p className="text-gray-500 mb-8">Pick all that apply, you can add more later.</p>
                        <div className="flex flex-col gap-3">
                            {regularCategories.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => toggleCategory(c.id, selectedRegular, setSelectedRegular)}
                                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-base flex items-center gap-3 ${selectedRegular.includes(c.id)
                                        ? "border-primary bg-primary/5"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                >
                                    <span className="text-xl">{c.emoji}</span>
                                    <span className="font-medium text-gray-800">{c.label}</span>
                                    {selectedRegular.includes(c.id) && (
                                        <Check className="w-5 h-5 text-primary ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* step 5 — extras */}
                {step === 5 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            What Else Do You Want to Include?
                        </h1>
                        <p className="text-gray-500 mb-8">No pressure, these are totally optional.</p>
                        <div className="flex flex-col gap-3">
                            {extraCategories.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => toggleCategory(c.id, selectedExtras, setSelectedExtras)}
                                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-base flex items-center gap-3 ${selectedExtras.includes(c.id)
                                        ? "border-primary bg-primary/5"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                >
                                    <span className="text-xl">{c.emoji}</span>
                                    <span className="font-medium text-gray-800">{c.label}</span>
                                    {selectedExtras.includes(c.id) && (
                                        <Check className="w-5 h-5 text-primary ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { setSelectedExtras([]); goToStep(6); }}
                            className="text-sm text-primary font-medium mt-4 hover:underline"
                        >
                            None of these apply to me
                        </button>
                    </div>
                )}

                {/* step 6 — email & password */}
                {step === 6 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Almost Done — Set Up Your Login
                        </h1>
                        <p className="text-gray-500 mb-8">Just an email and password, that's it.</p>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                {error}
                            </div>
                        )}
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@university.edu"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-base mb-4"
                            autoFocus
                        />
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
                        <div className="relative mb-4">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="at least 8 characters"
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-base"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="mb-4">
                                <div className="flex gap-1.5 mb-1.5 h-1.5 w-full">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`flex-1 rounded-full transition-colors duration-300 ${
                                                strength >= level ? getStrengthColor() : "bg-gray-200"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className={`font-medium ${
                                        strength === 1 ? "text-red-500" :
                                        strength === 2 ? "text-yellow-600" :
                                        strength >= 3 ? "text-green-600" : "text-gray-500"
                                    }`}>
                                        {getStrengthLabel()}
                                    </span>
                                    {strength < 2 && (
                                        <span className="text-gray-400">Add numbers & symbols</span>
                                    )}
                                </div>
                            </div>
                        )}
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Re-enter Password</label>
                        <div className="relative mb-2">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="confirm your password"
                                className={`w-full px-4 py-3 pr-12 rounded-xl border bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 text-base ${
                                    confirmPassword && password !== confirmPassword
                                        ? "border-red-300 focus:border-red-500"
                                        : "border-gray-200 focus:border-primary"
                                }`}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-500 mt-1.5 ml-1 absolute -bottom-5">Passwords do not match</p>
                            )}
                        </div>
                    </div>
                )}

                {/* step 7 — building */}
                {step === 7 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                            <svg className="w-9 h-9 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
                                <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            Building your plan...
                        </h1>
                        <p className="text-gray-500 text-center max-w-sm mb-8">
                            Hey {name}, we're setting up your budget and categories. Just a sec.
                        </p>
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                )}
            </div>

            {/* bottom button */}
            {step < 7 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={next}
                            disabled={!canProceed()}
                            className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${canProceed()
                                ? "bg-primary text-white hover:bg-primary/90"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {step === 6 ? "Create account" : "Next"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
