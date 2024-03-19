// Import the database connection and table names from the db.js module.
import { db, tableNames } from './db.js'
import { buildSelectString, buildInsertString, buildDeleteString } from './dbutils.js'

// Function to record a user's decision (like, dislike, unsure) about another user.
export async function recordUserDecision(user1Id, user2Id, decision) {
    try {
        // SQL query to insert or update the decision in the database.
        // Make helper function for this in the future
        const insertDecisionQuery = `
            INSERT INTO ${tableNames.u_matches} (user_id, match_user_id, match_status) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE match_status = VALUES(match_status);
        `;
        // Execute the query with provided user IDs and decision.
        await db.query(insertDecisionQuery, [user1Id, user2Id, decision]);

        // Check if a reciprocal match exists.
        const result = await checkMatch(user1Id, user2Id);
        // If both users have liked each other, return a match found response.
        if (decision === 'match' && result.length > 0) {
            return { matchFound: true, message: "It's a match!" };
        }
        // Otherwise, indicate that the decision has been recorded and waiting for the other user.
        return { matchFound: false, message: "Decision recorded. Waiting for the other user." };

    } catch (error) {
        // Log and throw an error if any part of the process fails.
        console.error('Error in recordUserDecision:', error);
        throw new Error('Failed to record user decision');
    }
}

// Function to check if two users have mutually liked each other.
export async function checkMatch(user1Id, user2Id) {
    return new Promise((resolve, reject) => {
        const { queryString, values } = buildSelectString("match_status", tableNames.u_matches, {
            user_id: user2Id,
            match_user_id: user1Id,
            match_status: 'match'
        });

        // Execute the query to find if there's a match.
        db.query(queryString, values, (err, results) => {
            if (err) {
                // Log and reject the promise if there's an error.
                console.error("Error fetching match status from database:", err);
                reject(err);
                return;
            }
            // Resolve the promise with the results of the query.
            resolve(results);
        });
    });
}

// Function to retrieve all user IDs that a specified user has marked as 'unsure'.
export async function getSavedMatches(userId) {
    return new Promise((resolve, reject) => {
        const { queryString, values } = buildSelectString("match_user_id", tableNames.u_matches, {
            user_id: userId,
            match_status: 'unsure'
        });
  
        // Execute the query to find saved matches.
        db.query(queryString, values, (err, rows) => {
            if (err) {
                // Log and reject the promise if there's an error.
                console.error("Error fetching user IDs from database:", err);
                reject(err);
                return;
            }
  
            // Extract user_id from each row and return an array of user_ids.
            const saveIds = rows.map(row => row.match_user_id);
            resolve(saveIds);
        });
    });
}

// Function to delete a match decision from the database.
export async function deleteMatchDecision(userId, matchUserId, decision) {
    try {
        const { queryString, values } = buildDeleteString(tableNames.u_matches, {
            user_id: userId,
            match_user_id: matchUserId,
            match_status: decision
        });

        // Execute the query to delete the specified decision.
        await db.query(queryString, values);
        // Log the successful deletion.
        console.log(`Deleted decision '${decision}' for user_id=${userId} and match_user_id=${matchUserId}.`);

    } catch (error) {
        // Log and throw an error if the deletion fails.
        console.error('Error in deleteMatchDecision:', error);
        throw new Error('Failed to delete match decision');
    }
}