import { Router } from 'express'
import LoginRouter from './login.js'
import AccountRouter from './account.js'
import PreferenceRouter from './preferences.js'
import ProfileRouter from './profile.js'
import { AuthStatusChecker } from '../auth.js'

const router = Router()

router.use('/login', LoginRouter)
router.use('/account', AccountRouter)
router.use('/preferences', PreferenceRouter)    // TODO: prepend AuthStatusChecker
router.use('/profile', ProfileRouter)

export default router