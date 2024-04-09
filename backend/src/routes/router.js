import { Router } from 'express'
import LoginRouter from './login.js'
import AccountRouter from './account.js'
import PreferenceRouter from './preferences.js'
import MatchRouter from './match.js'
import ProfileRouter from './profile.js'
import EmailAuthRouter from './email-auth.js'
import SubleaseRouter from './sublease.js'
import { AuthStatusChecker } from '../auth.js'
import { userIDParser } from './requestParser.js'

const router = Router()

router.use(userIDParser)

router.use('/login', LoginRouter)
router.use('/match', MatchRouter)
router.use('/account', AccountRouter)
router.use('/preferences', PreferenceRouter)
 // TODO: prepend AuthStatusChecker
router.use('/profile', AuthStatusChecker, ProfileRouter)
router.use('/email-auth', EmailAuthRouter)
router.use('/match', MatchRouter)
router.use('/sublease', SubleaseRouter)

export default router