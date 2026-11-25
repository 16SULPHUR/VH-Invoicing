import { Component } from "react";
import { useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

function ErrorFallback({ error, onRetry }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <h1 className="text-2xl font-bold text-primary">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">{error?.message ?? String(error)}</p>
      <div className="flex gap-3">
        <Button onClick={onRetry}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload app
        </Button>
      </div>
    </div>
  );
}

/** Route errors (render failures, stale lazy chunks) are caught by the router, not by React. */
export function RouteError() {
  return <ErrorFallback error={useRouteError()} onRetry={() => window.location.reload()} />;
}

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <ErrorFallback error={this.state.error} onRetry={() => this.setState({ error: null })} />
    );
  }
}
