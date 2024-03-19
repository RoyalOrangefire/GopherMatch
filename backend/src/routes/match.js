import { Router } from 'express';
import { recordUserDecision, deleteMatchDecision, getSavedMatches } from '../database/match.js';


const router = Router();

// Endpoint to record a user's decision about another user
// Takes a json with the parameters user1Id, user2Id, decision
router.post('/matcher', async (req, res) => {
    const { user1Id, user2Id, decision } = req.body;

    // Basic validation
    if (!user1Id || !user2Id || !decision) {
        return res.status(400).json({ error: "Missing required fields: user1Id, user2Id, or decision." });
    }

    try {
        const result = await recordUserDecision(user1Id, user2Id, decision);
        res.json(result);
    } catch (error) {
        console.error('Error processing match:', error);
        res.status(500).json({ error: "Failed to process match decision." });
    }
});

// http://localhost:3000/api/match/saved-matches/43
// replace last number with user id to get their saved users
router.get('/saved-matches/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return res.status(400).send({ error: "Invalid user ID." });
        }

        const savedMatches = await getSavedMatches(userId);
        res.json(savedMatches);
    } catch (error) {
        console.error('Failed to retrieve saved matches:', error);
        res.status(500).send({ error: "Internal server error." });
    }
});

// Delete a decision from the match table (remove a save for a user with decision unsure)
// Takes a json with the parameters user1Id, user2Id, decision
router.delete('/remove', async (req, res) => {
    // Basic validation
    const { user1Id, user2Id, decision } = req.body;
    if (!user1Id || !user2Id || !decision) {
        return res.status(400).json({ error: "Missing required fields: user1Id, user2Id, or decision." });
    }

    try {
        await deleteMatchDecision(user1Id, user2Id, decision);
        res.status(200).send({ message: "Match decision deleted successfully." });
    } catch (error) {
        console.error('Error processing match:', error);
        res.status(500).json({ error: "Failed to process match decision." });
    }
});

export default router;