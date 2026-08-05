import { Component, type ErrorInfo, type ReactNode } from "react";
import { IS_DEV } from "@/lib/appConfig";
import { hideSplashScreen } from "@/lib/nativeSplash";

interface Props {
  children: ReactNode;
  onResetLocalData: () => void;
  onReturnToMenu: () => void;
}

interface State {
  hasError: boolean;
  confirmingReset: boolean;
  errorMessage: string;
}

/**
 * Branded recovery screen. Never shows a stack trace in production, never
 * transmits crash data, and never reloads itself automatically.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, confirmingReset: false, errorMessage: "Unknown error" };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, errorMessage: error.message || String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The native splash must never be left covering a recovery screen.
    hideSplashScreen();
    if (IS_DEV) {
      console.error("[Tap or Trap!] Unhandled UI error", error, info.componentStack);
    }
  }

  private restart = () => {
    this.setState({ hasError: false, confirmingReset: false, errorMessage: "Unknown error" });
    if (typeof window !== "undefined") window.location.reload();
  };

  private toMenu = () => {
    this.setState({ hasError: false, confirmingReset: false, errorMessage: "Unknown error" });
    this.props.onReturnToMenu();
  };

  private resetData = () => {
    this.props.onResetLocalData();
    this.setState({ hasError: false, confirmingReset: false, errorMessage: "Unknown error" });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        role="alert"
        className="safe-screen grid place-items-center bg-arcade-bg-deep px-6 text-arcade-text"
      >
        <div className="arcade-panel w-full max-w-sm p-7 text-center">
          <h1 className="sticker-text text-3xl text-neon-red glow-red">Tap or Trap! hit a snag.</h1>
          <p className="ui-body mt-4 text-[15px] text-arcade-text/95">
            Your saved progress should still be available.
          </p>
          <pre className="ui-body mt-4 max-h-40 overflow-auto whitespace-pre-wrap break-words border border-neon-red bg-neon-red/10 p-3 text-left text-sm text-neon-red">
            {this.state.errorMessage}
          </pre>

          {this.state.confirmingReset ? (
            <div className="mt-6 grid gap-3">
              <p className="ui-body text-[15px] font-semibold text-neon-red">
                Reset local data? This permanently deletes scores, XP, achievements, statistics and
                unlocked themes on this device.
              </p>
              <button
                type="button"
                onClick={this.resetData}
                className="arcade-btn ui-title min-h-12 border border-neon-red bg-neon-red/15 py-3 text-base text-neon-red"
              >
                Yes, reset local data
              </button>
              <button
                type="button"
                onClick={() => this.setState({ confirmingReset: false })}
                className="arcade-btn ui-title min-h-12 border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="mt-7 grid gap-3">
              <button
                type="button"
                onClick={this.restart}
                className="arcade-btn sticker-sm min-h-12 bg-neon-green py-3 text-lg text-arcade-bg-deep"
              >
                Restart App
              </button>
              <button
                type="button"
                onClick={this.toMenu}
                className="arcade-btn ui-title min-h-12 border border-arcade-line bg-arcade-surface py-3 text-base text-arcade-text"
              >
                Return to Main Menu
              </button>
              <button
                type="button"
                onClick={() => this.setState({ confirmingReset: true })}
                className="ui-title min-h-12 text-[15px] text-neon-red underline underline-offset-4"
              >
                Reset Local Data
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }
}
