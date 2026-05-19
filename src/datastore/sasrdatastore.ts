import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface SASRSessionData {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  score: number;
  attempt: number;
  totalBeats: number;
  correctBeats: number;
  mistakeCount: number;
  mistakes: MistakeRecord[];
  completedFully: boolean;
  tempo: number;
}

export interface MistakeRecord {
  beatIndex: number;
  timestamp: number;
  expectedNotes: number[];
  playedNote: number;
  measure: number;
  beatInMeasure: number;
}

class SASRDataStore {
  // ── Write ────────────────────────────────────────────────────────────────

  async saveSession(
    sessionData: Omit<SASRSessionData, "id" | "timestamp" | "attempt">
  ): Promise<SASRSessionData> {
    const { data: { user } } = await supabase.auth.getUser();

    // Calculate attempt number for this song from Supabase
    let attempt = 1;
    if (user) {
      const { count } = await supabase
        .from("sasr_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("title", sessionData.title);
      attempt = (count ?? 0) + 1;
    }

    const newSession: SASRSessionData = {
      ...sessionData,
      id: `sasr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      attempt,
    };

    if (!user) {
      console.warn("SASR: no user session, saving to localStorage only");
      this._saveLocalFallback(newSession);
      return newSession;
    }

    const { error } = await supabase.from("sasr_sessions").upsert({
      id: newSession.id,
      user_id: user.id,
      title: newSession.title,
      date: newSession.date,
      timestamp: newSession.timestamp,
      score: newSession.score,
      attempt: newSession.attempt,
      total_beats: newSession.totalBeats,
      correct_beats: newSession.correctBeats,
      mistake_count: newSession.mistakeCount,
      mistakes: newSession.mistakes,
      completed_fully: newSession.completedFully,
      tempo: newSession.tempo,
    });

    if (error) {
      console.error("SASR Supabase save failed:", error.message);
      this._saveLocalFallback(newSession); // graceful fallback
    }

    return newSession;
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  async getAllSessions(): Promise<SASRSessionData[]> {
    const { data, error } = await supabase
      .from("sasr_sessions")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error || !data) {
      console.error("SASR fetch failed:", error?.message);
      return this._loadLocalFallback();
    }

    return data.map(this._fromRow);
  }

  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<SASRSessionData[]> {
    const { data, error } = await supabase
      .from("sasr_sessions")
      .select("*")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("timestamp", { ascending: true });

    if (error || !data) return [];
    return data.map(this._fromRow);
  }

  async getRecentSessions(days: number): Promise<SASRSessionData[]> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return this.getSessionsByDateRange(start, end);
  }

  async getSessionsGroupedByDate(days: number): Promise<Map<string, SASRSessionData[]>> {
    const sessions = await this.getRecentSessions(days);
    const grouped = new Map<string, SASRSessionData[]>();
    sessions.forEach((s) => {
      const key = s.date.split("T")[0];
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(s);
    });
    return grouped;
  }

  async getDailyAverageScores(
    days: number
  ): Promise<Array<{ date: string; score: number; count: number }>> {
    const grouped = await this.getSessionsGroupedByDate(days);
    const result: Array<{ date: string; score: number; count: number }> = [];
    grouped.forEach((sessions, date) => {
      const avg = Math.round(
        sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length
      );
      result.push({ date, score: avg, count: sessions.length });
    });
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getSongStatistics(songTitle: string) {
    const { data, error } = await supabase
      .from("sasr_sessions")
      .select("*")
      .eq("title", songTitle)
      .order("timestamp", { ascending: true });

    if (error || !data || data.length === 0) return null;

    const sessions = data.map(this._fromRow);
    const scores = sessions.map((s) => s.score);
    return {
      songTitle,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highScore: Math.max(...scores),
      lastScore: scores[scores.length - 1],
      totalAttempts: sessions.length,
      sessions,
    };
  }

  async getOverallStatistics() {
    const { data, error } = await supabase
      .from("sasr_sessions")
      .select("score, title");

    if (error || !data || data.length === 0) {
      return { totalSessions: 0, avgScore: 0, highScore: 0, lastScore: null, totalSongsPlayed: 0 };
    }

    const scores = data.map((r) => r.score);
    return {
      totalSessions: data.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highScore: Math.max(...scores),
      lastScore: scores[scores.length - 1],
      totalSongsPlayed: new Set(data.map((r) => r.title)).size,
    };
  }

  clearAllSessions(): void {
    // Only clears local fallback; Supabase data is user-owned — delete via dashboard if needed
    localStorage.removeItem("sasr_sessions");
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _fromRow(r: Record<string, unknown>): SASRSessionData {
    return {
      id: r.id as string,
      title: r.title as string,
      date: r.date as string,
      timestamp: r.timestamp as number,
      score: r.score as number,
      attempt: r.attempt as number,
      totalBeats: r.total_beats as number,
      correctBeats: r.correct_beats as number,
      mistakeCount: r.mistake_count as number,
      mistakes: (r.mistakes as MistakeRecord[]) ?? [],
      completedFully: r.completed_fully as boolean,
      tempo: r.tempo as number,
    };
  }

  private _saveLocalFallback(session: SASRSessionData): void {
    try {
      const existing = this._loadLocalFallback();
      existing.push(session);
      localStorage.setItem("sasr_sessions", JSON.stringify(existing));
    } catch {}
  }

  private _loadLocalFallback(): SASRSessionData[] {
    try {
      const raw = localStorage.getItem("sasr_sessions");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const sasrDataStore = new SASRDataStore();