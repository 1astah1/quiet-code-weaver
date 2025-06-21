
class LoadingOptimizer {
  private static instance: LoadingOptimizer;
  private loadingStates = new Map<string, boolean>();
  private minimumLoadTime = 800; // Минимальное время загрузки для UX
  private loadStartTimes = new Map<string, number>();

  public static getInstance(): LoadingOptimizer {
    if (!LoadingOptimizer.instance) {
      LoadingOptimizer.instance = new LoadingOptimizer();
    }
    return LoadingOptimizer.instance;
  }

  public startLoading(key: string): void {
    this.loadingStates.set(key, true);
    this.loadStartTimes.set(key, Date.now());
  }

  public async finishLoading(key: string): Promise<void> {
    const startTime = this.loadStartTimes.get(key);
    if (!startTime) return;

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, this.minimumLoadTime - elapsed);

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    this.loadingStates.set(key, false);
    this.loadStartTimes.delete(key);
  }

  public isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  public setMinimumLoadTime(time: number): void {
    this.minimumLoadTime = time;
  }
}

export const loadingOptimizer = LoadingOptimizer.getInstance();
