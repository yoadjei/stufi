import React from "react";

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[StuFi Error Boundary]", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-white px-6">
                    <div className="text-center max-w-sm">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = "/";
                            }}
                            className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: "hsl(217 91% 60%)" }}
                        >
                            Go to Home
                        </button>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="mt-6 text-left bg-gray-50 rounded-lg p-4">
                                <summary className="text-xs font-medium text-red-600 cursor-pointer">
                                    Error Details (Dev Only)
                                </summary>
                                <pre className="mt-2 text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
                                    {this.state.error.message}
                                    {"\n"}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
