"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 blur-3xl opacity-20 bg-primary rounded-full" />
                <FileQuestion className="relative h-24 w-24 text-primary animate-bounce" />
            </div>

            <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-6xl">
                404
            </h1>
            <h2 className="mb-6 text-xl font-semibold text-muted-foreground sm:text-2xl">
                Page Not Found
            </h2>

            <p className="mb-8 max-w-md text-muted-foreground">
                Oops! The news you're looking for seems to have vanished or been moved to a different headline.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild variant="default" size="lg" className="gap-2">
                    <Link href="/">
                        <Home className="h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                    <button onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </button>
                </Button>
            </div>

            <div className="mt-12 text-sm text-muted-foreground">
                Stay updated with the latest in tech on <span className="font-bold text-primary">Zidbit News</span>
            </div>
        </div>
    );
}
