import { Router } from 'express'
import { createErrorObj } from './routeutil.js'
import { 
    getProfile,
    updateProfile,
    getQnAs,
    createQnA,
    updateQnA,
    deleteQnA
} from '../database/profile.js'
import { SearchLocation, parseValue, parseToPosInt } from './requestParser.js'
const router = Router()

export default router

// Check and parse question_id appearing in body or query param to a positive integer
router.use((req, res, next) => {
    parseValue([SearchLocation.Body, SearchLocation.Query], 'question_id', parseToPosInt, 'positive integer', req, res, next)
})

// GET api/profile/
router.get('/', async (req, res) => {
    const user_id = req.query.user_id

    if (!user_id) {
        res.status(400).json(createErrorObj("Must include an user_id in the query parameter!"))
        return
    }

    try {
        const profile = await getProfile(user_id)
        res.status(200).json(profile)
    } catch(e) {
        console.error(e)
        res.status(400).json(createErrorObj(e))
    }
})

// Update profile
// PUT api/profile/
// REQUIRES the request's Content-Type to be "application/json"
router.put('/', async (req, res) => {
    const user_id = req.body.user_id
    const profile = req.body.profile
    delete profile.user_id // prevent user from chaning the user_id of their profile record

    if (!user_id || !profile) {
        res.status(400).json(createErrorObj("Must specify the user_id and profile object to update the profile!"))
        return
    }

    // If the user is updating a profile that's not their own
    if (user_id !== req.session.user.user_id) {
        res.status(400).json(createErrorObj("Cannot update someone else's profile!"))
        return
    }

    // Check if profile object is empty
    if (Object.keys(profile).length == 0) {
        res.status(400).json(createErrorObj("Must provide some new values to update! (To delete a value, use the value null)"))
        return
    }

    try {
        await updateProfile(user_id, profile)
        res.status(200).json({message: "Profile updated!"})
    } catch(e) {
        console.error(e)
        res.status(400).json(createErrorObj(e))
    }
})

// Get Question and Answers
// GET api/profile/qna/
router.get('/qna/', async (req, res) => {
    const user_id = req.query.user_id

    if (!user_id) {
        res.status(400).json(createErrorObj("Must include an user_id in the query parameter!"))
        return
    }

    try {
        const qnas = await getQnAs(user_id)
        res.status(200).json(qnas)
    } catch(e) {
        console.error(e)
        res.status(400).json(createErrorObj(e))
    }
})

// Create Answer to Question
// POST api/profile/qna/
router.post('/qna/', async (req, res) => {
    const user_id = req.body.user_id
    const question_id = req.body.question_id
    const answer = req.body.answer

    if (!user_id || !question_id || !answer) {
        res.status(400).json(createErrorObj("Must include an user_id, question_id, and answer in the body!"))
        return
    }

    // If the user is trying to create a QnA for another uesr
    if (user_id !== req.session.user.user_id) {
        res.status(400).json(createErrorObj("Can only create your own answer!"))
        return
    }

    try {
        await createQnA(user_id, question_id, answer)
        res.status(200).json({message: "Answer created!"})
    } catch(e) {
        console.error(e)
        res.status(400).json(createErrorObj(e))
    }
})

// Update Answer to Question
// POST api/profile/qna/
router.put('/qna/', async (req, res) => {
    const user_id = req.body.user_id
    const question_id = req.body.question_id
    const answer = req.body.answer

    if (!user_id || !question_id || !answer) {
        res.status(400).json(createErrorObj("Must include an user_id, question_id, and answer in the body!"))
        return
    }

    // TODO: Make this extensible to other forms of logins/api auth by using middleware
    // If the user is trying to update a QnA for another uesr
    if (user_id !== req.session.user.user_id) {
        res.status(400).json(createErrorObj("Can only update your own answer!"))
        return
    }

    try {
        await updateQnA(user_id, question_id, answer)
        res.status(200).json({message: "Answer updated!"})
    } catch(e) {
        console.error(e)
        res.status(400).json(createErrorObj(e))
    }
})

// Delete Answer to Question
// DELETE api/profile/qna/
router.delete('/qna/', async (req, res) => {
    const user_id = req.body.user_id
    const question_id = req.body.question_id

    if (!user_id || !question_id) {
        res.status(400).json(createErrorObj("Must include an user_id and question_id in the query parameter!"))
        return
    }

    // If the user is trying to delete a QnA for another uesr
    if (user_id !== req.session.user.user_id) {
        res.status(400).json(createErrorObj("Can only delete your own answer!"))
        return
    }

    try {
        await deleteQnA(user_id, question_id)
        res.status(200).json({message: "Answer deleted!"})
    } catch(e) {
        console.error(e)
        res.status(400).json(createErrorObj(e))
    }
})