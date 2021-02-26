const Post = require('../models/Post')


exports.viewCreateScreen = function(req, res){
    res.render('create-post')
}


exports.apiDelete = function(req, res){
    Post.delete(req.params.id, req.apiUser._id).then(()=>{
        res.json("congrats post deleted!")
    }).catch(()=>{
        res.json("you don't own permission to delete this post!")
    })
}

exports.apiCreate = function(req, res){
    let post = new Post(req.body, req.apiUser._id)
    post.create().then(newId=>{
        res.json('congrats!')
    }).catch(errors=>{
        res.json(post.errors)
    })
}

// creting a post:
exports.create = function(req, res){
    let post = new Post(req.body, req.session.user.id)
    post.create().then(newId=>{
        req.flash('success', 'Post Successfully created!')
        req.session.save(()=>res.redirect(`/post/${newId}`))
    }).catch(errors=>{
        errors.forEach(err=>req.flash('errors', err))
        req.session.save(()=>res.redirect('/create-post'))
    })
}

// updating a post:
exports.update = function(req, res){
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update().then(status=>{ // here the user does own the post.
        if(status === "success"){// and there is no errors.
            req.flash('success', "Post Successfully updated!")
            req.session.save(()=>res.redirect(`/post/${req.params.id}`))
        }else{ // but there is errors:
            post.errors.forEach(err=>req.flash('errors', err))
            req.session.save(()=>res.redirect(`/edit-post/${req.params.id}`))
        }
    }).catch(()=>{ // the user is up to no good:
        req.flash('errors', 'you do not have permission to miss with this post!')
        req.session.save(()=>res.redirect('/'))
    })
}

// delete a post:
exports.delete = function(req, res){
    Post.delete(req.params.id, req.visitorId).then(()=>{
        req.flash('success', "Post Successfully deleted!")
        req.session.save(()=>res.redirect(`/profile/${req.session.user.username}`))
    }).catch(()=>{
        req.flash('errors', "you can't delete this post!")
        req.session.save(()=>res.redirect('/'))
    })
}

// viewing a single post: 
exports.viewSingle = async function(req, res){
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('post-screen', {post: post, title: post.title})
    }catch{
        res.render('404')
    }
}

// viewing the edit screen:
exports.viewEditScreen = async function(req, res){
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('edit-screen', {post: post, title: post.title})
    }catch{
        req.flash('errors', 'you do not have permission to edit this post!')
        req.session.save(()=>res.redirect('/'))
    }
}

exports.search = async function(req, res){
    Post.search(req.body.searchTerm).then(data=>{
        res.json(data)
    }).catch(()=>res.json([]))
}