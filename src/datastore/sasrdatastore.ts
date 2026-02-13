// SASR Data Storage Utility
// This handles storing and retrieving SASR session data

export interface SASRSessionData {
  id: string;
  title: string;
  date: string; // ISO date string
  timestamp: number; // Unix timestamp
  score: number; // Percentage 0-100
  attempt: number; // Attempt number for this song
  totalBeats: number;
  correctBeats: number;
  mistakeCount: number;
  mistakes: MistakeRecord[];
  completedFully: boolean; // false if stopped due to 3 strikes
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
  private readonly STORAGE_KEY = 'sasr_sessions';
  private readonly MAX_SESSIONS = 1000; // Keep last 1000 sessions

  /**
   * Save a new SASR session
   */
  saveSession(sessionData: Omit<SASRSessionData, 'id' | 'timestamp' | 'attempt'>): SASRSessionData {
    const sessions = this.getAllSessions();
    
    // Calculate attempt number for this song
    const songSessions = sessions.filter(s => s.title === sessionData.title);
    const attempt = songSessions.length + 1;
    
    const newSession: SASRSessionData = {
      ...sessionData,
      id: this.generateId(),
      timestamp: Date.now(),
      attempt,
    };
    
    sessions.push(newSession);
    
    // Keep only the most recent sessions
    const trimmedSessions = sessions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, this.MAX_SESSIONS);
    
    this.saveSessions(trimmedSessions);
    
    return newSession;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): SASRSessionData[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading SASR sessions:', error);
      return [];
    }
  }

  /**
   * Get sessions for a specific date range
   */
  getSessionsByDateRange(startDate: Date, endDate: Date): SASRSessionData[] {
    const sessions = this.getAllSessions();
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  /**
   * Get sessions for the last N days
   */
  getRecentSessions(days: number): SASRSessionData[] {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.getSessionsByDateRange(startDate, endDate);
  }

  /**
   * Get sessions grouped by date
   */
  getSessionsGroupedByDate(days: number): Map<string, SASRSessionData[]> {
    const sessions = this.getRecentSessions(days);
    const grouped = new Map<string, SASRSessionData[]>();
    
    sessions.forEach(session => {
      const dateKey = session.date.split('T')[0]; // Get YYYY-MM-DD
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(session);
    });
    
    return grouped;
  }

  /**
   * Get average score per day for chart
   */
  getDailyAverageScores(days: number): Array<{ date: string; score: number; count: number }> {
    const grouped = this.getSessionsGroupedByDate(days);
    const result: Array<{ date: string; score: number; count: number }> = [];
    
    grouped.forEach((sessions, date) => {
      const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
      const avgScore = Math.round(totalScore / sessions.length);
      result.push({
        date,
        score: avgScore,
        count: sessions.length,
      });
    });
    
    // Sort by date
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get statistics for a specific song
   */
  getSongStatistics(songTitle: string) {
    const sessions = this.getAllSessions().filter(s => s.title === songTitle);
    
    if (sessions.length === 0) {
      return null;
    }
    
    const scores = sessions.map(s => s.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highScore = Math.max(...scores);
    const lastScore = sessions[sessions.length - 1].score;
    const totalAttempts = sessions.length;
    
    return {
      songTitle,
      avgScore,
      highScore,
      lastScore,
      totalAttempts,
      sessions,
    };
  }

  /**
   * Get overall statistics
   */
  getOverallStatistics() {
    const sessions = this.getAllSessions();
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        avgScore: 0,
        highScore: 0,
        lastScore: null,
        totalSongsPlayed: 0,
      };
    }
    
    const scores = sessions.map(s => s.score);
    const uniqueSongs = new Set(sessions.map(s => s.title));
    
    return {
      totalSessions: sessions.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highScore: Math.max(...scores),
      lastScore: sessions[sessions.length - 1].score,
      totalSongsPlayed: uniqueSongs.size,
    };
  }

  /**
   * Clear all sessions (for testing/reset)
   */
  clearAllSessions(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Export sessions as JSON
   */
  exportSessions(): string {
    return JSON.stringify(this.getAllSessions(), null, 2);
  }

  /**
   * Import sessions from JSON
   */
  importSessions(jsonData: string): void {
    try {
      const sessions = JSON.parse(jsonData);
      this.saveSessions(sessions);
    } catch (error) {
      console.error('Error importing sessions:', error);
      throw new Error('Invalid JSON data');
    }
  }

  // Private helper methods
  private saveSessions(sessions: SASRSessionData[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving SASR sessions:', error);
    }
  }

  private generateId(): string {
    return `sasr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const sasrDataStore = new SASRDataStore();