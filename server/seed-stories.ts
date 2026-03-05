// reseed stories as relatable Ghanaian student money worries

import "dotenv/config";
import { db } from "./db";
import { onboardingStories } from "@shared/schema";

const stories = [
    {
        order: 1,
        headline: "I should be saving more.",
        body: "",
        mediaType: "none" as const,
        mediaUrl: null,
        durationMs: 2200,
        isActive: true,
    },
    {
        order: 2,
        headline: "Am I going to be okay this month?",
        body: "",
        mediaType: "none" as const,
        mediaUrl: null,
        durationMs: 2000,
        isActive: true,
    },
    {
        order: 3,
        headline: "Wait... I just got my allowance last week 😩",
        body: "",
        mediaType: "none" as const,
        mediaUrl: null,
        durationMs: 2400,
        isActive: true,
    },
    {
        order: 4,
        headline: "I could eat rice and beans for a week...",
        body: "",
        mediaType: "none" as const,
        mediaUrl: null,
        durationMs: 2000,
        isActive: true,
    },
    {
        order: 5,
        headline: "My data bundle just finished again 📱",
        body: "",
        mediaType: "none" as const,
        mediaUrl: null,
        durationMs: 2500,
        isActive: true,
    },
    {
        order: 6,
        headline: "Transport money dey finish oo.",
        body: "",
        mediaType: "none" as const,
        mediaUrl: null,
        durationMs: 2200,
        isActive: true,
    },
    {
        order: 7,
        headline: "I get decent allowance, but where does it all go?",
        body: "",
        mediaType: "none" as const,
        mediaUrl: null,
        durationMs: 2600,
        isActive: true,
    },
    {
        order: 8,
        headline: "When is the next allowance again? 💸",
        body: "",
        mediaType: "none" as const,
        mediaUrl: null,
        durationMs: 2200,
        isActive: true,
    },
];

async function seed() {
    console.log("Seeding onboarding stories (thought bubbles)...");
    await db.delete(onboardingStories);
    for (const story of stories) {
        await db.insert(onboardingStories).values(story);
        console.log(`  ✓ "${story.headline}"`);
    }
    console.log(`Done — ${stories.length} thought bubbles seeded.`);
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
