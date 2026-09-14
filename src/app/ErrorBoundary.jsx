import { Component } from "react";
import { Button } from "@/components/ui/button";

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
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <h1 className="text-2xl font-bold text-primary">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">{this.state.error.message}</p>
        <div className="flex gap-3">
          <Button onClick={() => this.setState({ error: null })}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload app
          </Button>
        </div>
      </div>
    );
  }
}
