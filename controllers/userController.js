// requirements:
const Post = require('../models/Post')
const User = require('../models/User')
const Follow = require('../models/Follow')
const jwt = require('jsonwebtoken')


exports.apiGetPostsByAuthor = async function(req, res){
    try{
        let userDoc = await User.findByUsername(req.params.username)
        let posts = await Post.findPostByUserId(userDoc.id)
        res.json(posts)
    }catch{
        res.json("Unvalid username!")
    }
}

exports.apiMustBeLoggedIn = function(req, res, next){
    try{
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
        next()
    }catch{
        res.json('sorry, you must provide a valaid Tokens!')
    }
}


// is the username unique:
exports.doesUsernameExist = function(req, res){
    User.findByUsername(req.body.username).then(()=>{
        res.json(true)
    }).catch(()=>{
        res.json(false)
    })
}

// is email is unique:
exports.doesEmailExist = async function(req, res){
    let emailBool = await User.findByEmail(req.body.email)
    res.json(emailBool)
}


// some shared informations:
exports.sharedProfileData = async function(req, res, next){
    // getting the isVisitorsProfile and isFollowing infos:
    let isVisitorsProfile = false 
    let isFollowing = false
    if(req.session.user){
        isVisitorsProfile = req.userDoc.id.equals(req.session.user.id) // checking if the visitor does own the profile.
        isFollowing = await Follow.isVisitorFollowing(req.userDoc.id, req.visitorId) // does visitor already follow the account.
    }
    // passing the info to the session
    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing
    // getting the counts and passing it to the session:
    let postCountsPromise = Post.getPostNumById(req.userDoc.id)
    let flwrsCountsPromise = Follow.getFlwrsNumById(req.userDoc.id)
    let flwingCountsPromise = Follow.getFlwingNumById(req.userDoc.id)

    let [postCounts, flwrsCounts, flwingCounts] = await Promise.all([postCountsPromise, flwrsCountsPromise, flwingCountsPromise])
   
    req.postCounts = postCounts
    req.flwrsCounts = flwrsCounts
    req.flwingCounts = flwingCounts

    next()
}


// checking if the user logged in:
exports.mustBeLoggedIn = function(req, res, next){
    if(req.session.user){
        next()
    }else{
        req.flash('errors', 'you must be logged in to preform this action!')
        req.session.save(()=>res.redirect('/'))
    }
}

// rendering the home page:
exports.home = async function(req, res){
    if(req.session.user){
        let posts = await Post.getFeed(req.session.user.id)
        res.render('home-dashboard', {posts: posts})
    }else{
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}

// loggin in the user:
exports.login = function(req, res){
    let user = new User(req.body)
    user.login().then(()=>{
        req.session.user = {username: user.data.username, avatar: user.avatar, id: user.data._id},
        req.session.save(()=>res.redirect('/'))
    }).catch(err=>{
        req.flash('errors', err)
        req.session.save(()=>res.redirect('/'))
    })
}

// api Loggin:
exports.apiLogin = function(req, res){
    let user = new User(req.body)
    user.login().then(()=>{
        res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: "3d"}))
    }).catch(err=>{
        res.json("nice try nassty bitsch!")
    })
}

// registering the user:
exports.register = function(req, res){
    let user = new User(req.body)
    user.register().then(()=>{
        req.session.user = {username: user.data.username, avatar: user.avatar, id: user.data._id}
        req.session.save(()=>res.redirect('/'))
    }).catch(errors=>{
        errors.forEach(err=>req.flash('regErrors', err))
        req.session.save(()=>res.redirect('/'))
    })
}

// logging out:
exports.logout = function(req, res){
    req.session.destroy(()=>res.redirect('/'))
}

// view the profile:
// seeing if the user even exists:
exports.ifUserExist = function(req, res, next){
    User.findByUsername(req.params.username).then(userDoc=>{
        req.userDoc = userDoc
        next()
    }).catch(()=>{
        res.render('404')
    })
}

// now displaying the profile:
exports.viewPostProfile = async function(req, res){
    Post.findPostByUserId(req.userDoc.id).then(posts=>{
        res.render('profile-post', {
            title: `Profile for ${req.userDoc.username}`,
            currentPage: 'post',
            posts: posts,
            profileUsername: req.userDoc.username,
            profileAvatar: req.userDoc.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCounts: req.postCounts, flwrsCounts: req.flwrsCounts, flwingCounts: req.flwingCounts}
        })
    })
}

exports.viewFollowersProfile = async function(req, res){
    try{
        let followers = await Follow.getFollowersById(req.userDoc.id)
        res.render('followers-profile', {
            title: `Profile for ${req.userDoc.username}`,
            currentPage: 'followers',
            followers: followers,
            profileUsername: req.userDoc.username,
            profileAvatar: req.userDoc.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCounts: req.postCounts, flwrsCounts: req.flwrsCounts, flwingCounts: req.flwingCounts}
        })
    }catch{
        res.render('404')
    }
}

exports.viewFollowingProfile = async function(req, res){
    try{
        following = await Follow.getFollowingById(req.userDoc.id)
        console.log(following)
        res.render('following-profile', {
            title: `Profile for ${req.userDoc.username}`,
            currentPage: 'following',
            following: following,
            profileUsername: req.userDoc.username,
            profileAvatar: req.userDoc.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCounts: req.postCounts, flwrsCounts: req.flwrsCounts, flwingCounts: req.flwingCounts}
        })
    }catch{
        res.render('404')
    }
}