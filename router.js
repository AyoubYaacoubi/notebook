// requirements and configs
const express = require('express')
const router = express.Router()

const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

// user related routes:
router.get('/', userController.home) // 1 done
router.post('/login', userController.login) // 2 done
router.post('/logout', userController.logout) // 3 done
router.post('/register', userController.register) // 4 done

// profile related routes:
router.get('/profile/:username', userController.ifUserExist, userController.sharedProfileData, userController.viewPostProfile) // 11
router.get('/profile/:username/followers', userController.ifUserExist, userController.sharedProfileData, userController.viewFollowersProfile)
router.get('/profile/:username/following', userController.ifUserExist, userController.sharedProfileData, userController.viewFollowingProfile)
router.post('/doesUsernameExist', userController.doesUsernameExist)
router.post('/doesEmailExist', userController.doesEmailExist)
// Posts related routes:
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen) // 5 done
router.post('/create-post', userController.mustBeLoggedIn, postController.create) // 6 done
router.get('/post/:id', postController.viewSingle) // 7 done
router.get('/edit-post/:id', userController.mustBeLoggedIn, postController.viewEditScreen) // 8 done
router.post('/edit-post/:id', userController.mustBeLoggedIn, postController.update) // 9 done
router.post('/delete-post/:id', userController.mustBeLoggedIn, postController.delete) // 10 done

// follow related routes:
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow) // 12
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow) // 13

router.post('/search', postController.search)

module.exports = router