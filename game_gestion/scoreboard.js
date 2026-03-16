/*
  Scoreboard System
  Manages player scores, storage, and leaderboard display
*/
const ScoreboardSystem = (function () {
    'use strict';

    const STORAGE_KEY = 'survivalPark_scores';
    const MAX_NAME_LENGTH = 3;
    const TOP_SCORES = 10;

    /*
    Initialize scores from localStorage
     */
    function getScores() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading scores:', e);
            return [];
        }
    }

    /*
     Save scores to localStorage
     */
    function saveScores(scores) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
        } catch (e) {
            console.error('Error saving scores:', e);
        }
    }

    /**
      Add a new score to the leaderboard
      @param {string} playerName - Player name (max 3 characters)
      @param {number} kills - Number of kills
      @param {number} wave - Wave number reached
      @returns {object} - The added score object with rank
     */
    function addScore(playerName, kills, wave) {
        // Sanitize name: uppercase, max 3 chars, alphanumeric only
        const cleanName = (playerName || 'AAA').substring(0, MAX_NAME_LENGTH).toUpperCase();

        const score = {
            name: cleanName,
            kills: Math.max(0, kills || 0),
            wave: Math.max(1, wave || 1),
            timestamp: new Date().toISOString()
        };

        const scores = getScores();
        scores.push(score);

        // Sort by kills (descending), then by wave (descending), then by timestamp (newest first)
        scores.sort((a, b) => {
            if (b.kills !== a.kills) return b.kills - a.kills;
            if (b.wave !== a.wave) return b.wave - a.wave;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        saveScores(scores);

        // Return score with rank
        const rank = scores.indexOf(score) + 1;
        return { ...score, rank: rank };
    }

    /**
     * Get top N scores
     */
    function getTopScores(limit = TOP_SCORES) {
        const scores = getScores();
        return scores.slice(0, limit).map((score, index) => ({
            ...score,
            rank: index + 1
        }));
    }

    /**
     * Clear all scores (for testing/reset)
     */
    function clearScores() {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Show the name entry dialog after death
     * @param {object} stats - Object with {kills, wave} from the game
     */
    function showNameEntryScreen(stats) {
        const nameScreen = document.getElementById('name-entry-screen');
        if (!nameScreen) {
            console.error('Name entry screen element not found');
            return;
        }

        // Show the name entry screen
        nameScreen.style.display = 'flex';

        // Update stats display
        const killsDisplay = document.getElementById('final-kills');
        const waveDisplay = document.getElementById('final-wave');
        if (killsDisplay) killsDisplay.textContent = stats.kills || 0;
        if (waveDisplay) waveDisplay.textContent = stats.wave || 1;

        // Focus on input
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) {
            nameInput.value = '';
            nameInput.focus();
            
            // Add event listeners for keyboard shortcuts
            nameInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    submitNameAndSaveScore();
                }
                if (e.key === 'Escape') {
                    closeNameEntry();
                }
            };
        }
    }

    /**
     * Submit the player name and save score
     */
    function submitNameAndSaveScore() {
        const nameInput = document.getElementById('player-name-input');
        const killsDisplay = document.getElementById('final-kills');
        const waveDisplay = document.getElementById('final-wave');

        if (!nameInput) {
            console.error('Name input not found');
            return;
        }

        const playerName = nameInput.value.trim() || 'AAA';
        const kills = parseInt(killsDisplay?.textContent || 0);
        const wave = parseInt(waveDisplay?.textContent || 1);

        // Add score
        const savedScore = addScore(playerName, kills, wave);
        console.log('Score saved:', savedScore);

        // Hide name entry screen
        const nameScreen = document.getElementById('name-entry-screen');
        if (nameScreen) nameScreen.style.display = 'none';

        // Return to main menu
        window.location.href = 'index.html';
    }

    /**
     * Display the leaderboard screen
     */
    function showLeaderboard() {
        const leaderboardScreen = document.getElementById('leaderboard-screen');
        if (!leaderboardScreen) {
            console.error('Leaderboard screen element not found');
            return;
        }

        // Show leaderboard
        leaderboardScreen.style.display = 'flex';

        const topScores = getTopScores(TOP_SCORES);
        const leaderboardTable = document.getElementById('leaderboard-table');

        if (!leaderboardTable) {
            console.error('Leaderboard table not found');
            return;
        }

        // Clear previous content (keep header)
        const tbody = leaderboardTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
        }

        if (topScores.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="4" style="text-align: center; padding: 20px;">No scores yet. Be the first!</td>';
            if (tbody) tbody.appendChild(emptyRow);
            return;
        }

        // Add top 10 scores
        topScores.forEach((score, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align: center; width: 60px;">${index + 1}</td>
                <td style="text-align: center; width: 100px;">${score.name}</td>
                <td style="text-align: center; width: 100px;">${score.kills}</td>
                <td style="text-align: center; width: 100px;">${score.wave}</td>
            `;
            if (tbody) tbody.appendChild(row);
        });
    }

    /**
     * Hide the leaderboard screen
     */
    function hideLeaderboard() {
        const leaderboardScreen = document.getElementById('leaderboard-screen');
        if (leaderboardScreen) leaderboardScreen.style.display = 'none';
    }

    /**
     * Close the name entry screen (for Cancel button)
     */
    function closeNameEntry() {
        const nameScreen = document.getElementById('name-entry-screen');
        if (nameScreen) nameScreen.style.display = 'none';
        // Return to main menu
        window.location.href = 'index.html';
    }

    return {
        addScore: addScore,
        getScores: getScores,
        getTopScores: getTopScores,
        clearScores: clearScores,
        showNameEntryScreen: showNameEntryScreen,
        submitNameAndSaveScore: submitNameAndSaveScore,
        showLeaderboard: showLeaderboard,
        hideLeaderboard: hideLeaderboard,
        closeNameEntry: closeNameEntry
    };
})();
