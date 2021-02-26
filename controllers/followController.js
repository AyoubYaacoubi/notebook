const Follow = require('../models/Follow')

// following a users:
exports.addFollow = function(req, res){
    let follow = new Follow(req.params.username, req.visitorId)
    follow.create().then(()=>{
        req.flash('success', `you're following ${req.params.username} Now!`)
        req.session.save(()=>res.redirect(`/profile/${req.params.username}`))
    }).catch(errors=>{
        errors.forEach(err=>req.flash('errors', err))
        req.session.save(()=>res.redirect('/'))
    })
}

// unfollowing a user:
exports.removeFollow = function(req, res){
    let follow = new Follow(req.params.username, req.visitorId)
    follow.delete().then(()=>{
        req.flash('success', `successfully stopped following ${req.params.username}`)
        req.session.save(()=>res.redirect(`/profile/${req.params.username}`))
    }).catch(errors=>{
        errors.forEach(err=>req.flash('errors', err))
        req.session.save(()=>res.redirect('/'))
    })
}