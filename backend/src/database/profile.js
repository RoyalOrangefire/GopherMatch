import { db, tableNames } from './db.js'
import { queryRowsToArray, buildSelectString, buildInsertString, buildUpdateString, buildDeleteString } from './dbutils.js'
import{generateBlobSasUrl} from '../blobService.js'


// Returns bio of given user_id
export async function getProfile(user_id) {
  return new Promise((resolve, reject) => {
      // Fetching the user's profile
      const profilePromise = new Promise((resolveProfile) => {
          const qr = buildSelectString("*", tableNames.u_bios, { user_id });

          db.query(qr.queryString, qr.values, (err, rows) => {
              if (err) {
                  resolveProfile({}); // Don't return a bio if not found
                  return;
              }

              const profile = queryRowsToArray(rows);
              if (profile.length === 1) {
                  resolveProfile(profile[0]);
              } else {
                  // No profile found or multiple profiles found, return an empty profile
                  resolveProfile({});
              }
          });
      });

      // Fetching the user's QnA answers
      const qnaPromise = new Promise((resolveQnA) => {
          const qnaQr = buildSelectString("*", tableNames.u_qna, { user_id });

          db.query(qnaQr.queryString, qnaQr.values, (err, rows) => {
              if (err) {
                  resolveQnA([]); // Default empty QnA answers
                  return;
              }

              const qnaAnswers = rows.map(row => ({ question_id: row.question_id, option_id: row.option_id }));
              resolveQnA(qnaAnswers);
          });
      });

      // Combining profile data and QnA answers
      Promise.all([profilePromise, qnaPromise])
          .then(([profile, qnaAnswers]) => {
              resolve({ ...profile, qnaAnswers });
          })
          .catch(error => reject(error));
  });
}





// Creates and stores a profile in DB
// second argument (profile obj) is optional
export async function createBio(user_id, profile) {
    if (!profile) profile = {}
    return new Promise((resolve, reject) => {
        const qr = buildInsertString(tableNames.u_bios, {user_id, ...profile})

        db.query(qr.queryString, qr.values, (err, res) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") reject("Profile already exists")
                else reject(err)
                return
            }
            if (res.affectedRows != 1) {
                reject({})
            } else {
                // res.insertId exists iff exactly one row is inserted
                resolve({user_id: res.insertId, ...profile})
            }
        })
    })
}

// updates the stored profile
// database/profile.js

// ... Other imports and functions

export async function updateProfile(user_id, profile) {
    return new Promise(async (resolve, reject) => {
      const { qnaAnswers, ...profileData } = profile;
  
      try {
         if (Object.keys(profileData).length > 0) {
        const updateQuery = buildUpdateString(tableNames.u_bios, { user_id }, profileData);
        console.log(updateQuery);
        await db.query(updateQuery.queryString, updateQuery.values);
      }
  
        for (const { question_id, option_id } of qnaAnswers) {
          // Fetch the existing answer
          const existingAnswerPromise = new Promise((resolveQuery, rejectQuery) => {
            const qr = buildSelectString("*", tableNames.u_qna, { user_id, question_id });
            db.query(qr.queryString, qr.values, (err, rows) => {
              if (err) {
                rejectQuery(err);
              } else {
                resolveQuery(rows);
              }
            });
          });
  
          let existingAnswer;
          try {
            existingAnswer = await existingAnswerPromise;
          } catch (error) {
            reject(error);
            return;
          }
  
          let qnaUpdateQuery;
          if (existingAnswer && existingAnswer.length > 0) {
            // Update existing answer
            qnaUpdateQuery = buildUpdateString(tableNames.u_qna, { user_id, question_id }, { option_id });
          } else {
            // Insert new answer
            qnaUpdateQuery = buildInsertString(tableNames.u_qna, { user_id, question_id, option_id });
          }
  
          await db.query(qnaUpdateQuery.queryString, qnaUpdateQuery.values);
        }
  
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  export async function getAllUserIds() {
    return new Promise((resolve, reject) => {
        // Assuming 'user_id' is the column name in your 'users' table that holds the user IDs
        const qr = buildSelectString("user_id", tableNames.users, {});
  
        db.query(qr.queryString, qr.values, (err, rows) => {
            if (err) {
                console.error("Error fetching user IDs from database:", err);
                reject(err);
                return;
            }
  
            // Extract user_id from each row and return an array of user_ids
            const userIds = rows.map(row => row.user_id);
            resolve(userIds);
        });
    });
  }
  
  export async function savePictureUrl(user_id, pictureUrl, pic_number) {
    return new Promise((resolve, reject) => {
        // Adjust the query to include pic_number in the INSERT statement
        // and ensure the ON DUPLICATE KEY UPDATE clause updates the picture_url for the existing pic_number for the user.
        const qr = `INSERT INTO u_pictures (user_id, picture_url, pic_number) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE picture_url = VALUES(picture_url);`;
        
        // Adjust the parameters to include pic_number
        db.query(qr, [user_id, pictureUrl, pic_number], (err, result) => {
            if (err) {
                console.error("Error saving picture URL to database:", err);
                reject(err);
                return ;
            }
            resolve(result);
        });
    });
}

// Function to get all picture URLs for a user

export async function retrievePictureUrls(user_id) {
  return new Promise((resolve, reject) => {
    const queryString = `SELECT picture_url, pic_number FROM ${tableNames.u_pictures} WHERE user_id = ?`;

    db.query(queryString, [user_id], (err, rows) => {
      if (err) {
        console.error("Error fetching picture URLs from database:", err);
        reject(err);
        return;
      }

      // Map through each row to extract the blob name and generate a SAS URL
      const sasUrlPromises = rows.map(row => {
        // Extract the blob name from the picture_url
        const urlParts = row.picture_url.split('/');
        const blobName = urlParts[urlParts.length - 1]; // Gets the last part of the URL

        return generateBlobSasUrl(blobName); // Use the extracted blob name
      });

      Promise.all(sasUrlPromises)
        .then(sasUrls => resolve(sasUrls))
        .catch(error => reject(error));
    });
  });
}

  export async function removePicture(user_id, pic_number) {
      try {
        const { queryString, values } = buildDeleteString(tableNames.u_pictures, {
          user_id: user_id,
          pic_number: pic_number
        });

        // Execute the query to delete the specified decision.
        await db.query(queryString, values);

        await db.query('UPDATE u_pictures SET pic_number = pic_number - 1 WHERE user_id = ? AND pic_number > ?', [user_id, pic_number], (error, results) => {
          if (error) {
            console.error('Error reordering pictures:', error);
          } else {
            console.log("Successfully reordered pictures");
          }
        });

        // Log the successful deletion.
        console.log(`Deleted picture ${pic_number} for user_id=${user_id}.`);

      } catch (error) {
        // Log and throw an error if the deletion fails.
        console.error('Error in removePicture:', error);
        throw new Error('Failed to remove picture');
      }
  }

export async function insertTopFive(user_id, option_id, input){
  try {
    const query = `
        INSERT INTO ${tableNames.u_topfive} (user_id, option_id, input)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE input = VALUES(input);
    `;

    await db.query(query, [user_id, option_id, input]);

  } catch (error) {
    console.error('Error in insertTopFive:', error);
    throw new Error('Failed to insert top five');
  }
}

export async function getTopFive(user_id, option_id){
  return new Promise((resolve, reject) => {
    const query = `
        SELECT input
        FROM ${tableNames.u_topfive}
        WHERE user_id = ? AND option_id = ?;
    `;

    db.query(query [user_id, option_id], (err, rows) => {
      if (err) {
        console.error("Error getting top five option", err);
        reject(err);
        return;
      }

      const optInput = rows.map(row => row.input);
      resolve(optInput);
    });
  });
}