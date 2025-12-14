import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "40px", backgroundColor: "#111", color: "white", height: "100vh", fontFamily: "monospace" }}>
                    <h1 style={{ color: "#ff5555" }}>Something went wrong.</h1>
                    <p>Please check the console for more details.</p>
                    <pre style={{ backgroundColor: "#000", padding: "20px", borderRadius: "8px", overflow: "auto" }}>
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}
