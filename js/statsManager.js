/**
 * StatsManager - Centralized statistics management with localStorage persistence
 * Handles all game statistics tracking, loading, saving, and display
 */
class StatsManager {
    static instance = null;
    static STORAGE_KEY = 'scoundrelStats';
    static SCHEMA_VERSION = 1;

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!StatsManager.instance) {
            StatsManager.instance = new StatsManager();
        }
        return StatsManager.instance;
    }

    constructor() {
        this.stats = this.load();
    }

    /**
     * Load stats from localStorage with migration support
     * @returns {Object} Game statistics object
     */
    load() {
        try {
            // Check if localStorage is available (private browsing blocks it)
            if (!window.localStorage) {
                console.warn('localStorage not available');
                return this.getDefaultStats();
            }
            const stored = localStorage.getItem(StatsManager.STORAGE_KEY);
            if (!stored) {
                return this.getDefaultStats();
            }

            const data = JSON.parse(stored);
            
            // Migrate old schema if needed
            if (!data.version || data.version < StatsManager.SCHEMA_VERSION) {
                return this.migrateOldSchema(data);
            }

            return data;
        } catch (error) {
            console.warn('Error loading stats from localStorage:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Get default stats structure
     * @returns {Object} Default stats object
     */
    getDefaultStats() {
        return {
            version: StatsManager.SCHEMA_VERSION,
            played: 0,
            won: 0,
            bestRoom: 0,
            totalCards: 0,
            highestHP: 20,
            totalFlees: 0,
            longestStreak: 0,
            currentStreak: 0
        };
    }

    /**
     * Migrate old schema to new schema
     * @param {Object} oldData - Old stats format
     * @returns {Object} Migrated stats
     */
    migrateOldSchema(oldData) {
        const defaults = this.getDefaultStats();
        return {
            version: StatsManager.SCHEMA_VERSION,
            played: oldData.played || 0,
            won: oldData.won || 0,
            bestRoom: oldData.bestRoom || 0,
            totalCards: oldData.totalCards || 0,
            highestHP: oldData.highestHP || 20,
            totalFlees: oldData.totalFlees || 0,
            longestStreak: oldData.longestStreak || 0,
            currentStreak: oldData.currentStreak || 0
        };
    }

    /**
     * Save game outcome and update persistent stats
     * @param {Object} gameOutcome - Game end stats from Game.getGameOverStats()
     */
    save(gameOutcome) {
        try {
            // Increment games played
            this.stats.played += 1;

            // Update win stats and streak
            if (gameOutcome.won) {
                this.stats.won += 1;
                this.stats.currentStreak += 1;
                this.stats.longestStreak = Math.max(this.stats.longestStreak, this.stats.currentStreak);
            } else {
                this.stats.currentStreak = 0;
            }

            // Update best room
            this.stats.bestRoom = Math.max(this.stats.bestRoom, gameOutcome.roomsCompleted);

            // Update total cards defeated (accumulate rooms completed)
            this.stats.totalCards += gameOutcome.roomsCompleted;

            // Update highest HP
            this.stats.highestHP = Math.max(this.stats.highestHP, gameOutcome.finalHp);

            // Add flees count if provided
            if (gameOutcome.timesFleed !== undefined) {
                this.stats.totalFlees += gameOutcome.timesFleed;
            }

            // Persist to localStorage
            this.persist();

            console.log('✓ Stats saved:', this.stats);
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    /**
     * Persist stats to localStorage
     */
    persist() {
        try {
            localStorage.setItem(StatsManager.STORAGE_KEY, JSON.stringify(this.stats));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded - unable to save stats');
            } else {
                console.error('Error persisting stats to localStorage:', error);
            }
        }
    }

    /**
     * Calculate win rate as percentage
     * @returns {number} Win rate percentage (0-100)
     */
    getWinRate() {
        if (this.stats.played === 0) return 0;
        return Math.round((this.stats.won / this.stats.played) * 100);
    }

    /**
     * Get all stats
     * @returns {Object} Current stats object
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Update stats display in UI
     */
    updateDisplay() {
        const stats = this.getStats();
        const winRate = this.getWinRate();

        // Update all stat display elements
        const displayMapping = {
            'gamesPlayed': stats.played,
            'gamesWon': stats.won,
            'winRate': `${winRate}%`,
            'bestRun': stats.bestRoom > 0 ? `Room ${stats.bestRoom}` : 'Room 0',
            'totalCards': stats.totalCards,
            'highestHP': stats.highestHP,
            'currentStreak': stats.currentStreak,
            'longestStreak': stats.longestStreak,
            'totalFlees': stats.totalFlees
        };

        Object.entries(displayMapping).forEach(([elementId, value]) => {
            const element = UIBuilder.getCachedElement(elementId);
            if (element) {
                element.textContent = value;
            }
        });

        console.log('✓ Stats display updated');
    }

    /**
     * Reset all stats with confirmation
     * @returns {boolean} True if user confirmed reset
     */
    reset() {
        const confirmed = confirm(
            'Are you sure you want to reset all statistics?\n\n' +
            `Games Played: ${this.stats.played}\n` +
            `Games Won: ${this.stats.won}\n` +
            `Best Run: Room ${this.stats.bestRoom}\n\n` +
            'This action cannot be undone.'
        );

        if (confirmed) {
            this.stats = this.getDefaultStats();
            this.persist();
            this.updateDisplay();
            alert('Statistics have been reset.');
            console.log('✓ Stats reset');
            return true;
        }
        return false;
    }

    /**
     * Clear localStorage completely (for debugging)
     */
    clearStorage() {
        localStorage.removeItem(StatsManager.STORAGE_KEY);
        this.stats = this.getDefaultStats();
        console.log('✓ localStorage cleared');
    }
}
