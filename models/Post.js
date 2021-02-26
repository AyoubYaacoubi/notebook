// requirements:
const postsCollection = require('../db').db().collection('posts')
const followsCollection = require('../db').db().collection('follows')
const User = require('./User')
const ObjectID = require('mongodb').ObjectID
const sanitizeHTML = require('sanitize-html')

// establishing the blueprint
let Post = function(d, userId, reqdPostId){
    this.data = d
    this.errors = []
    this.userId = userId
    this.reqdPostId = reqdPostId
}

// cleaning up the users Input:
Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){this.data.title = ""}
    if(typeof(this.data.title) != "string"){this.data.title = ""}
    // getting rid of some bugs and sanitizing the user input:
    this.data = {
        title: sanitizeHTML(this.data.title, {allowedAttributes: {}, allowedTags: []}),
        body: sanitizeHTML(this.data.body, {allowedAttributes: {}, allowedTags: []}),
        createdDate: new Date(),
        author: ObjectID(this.userId)
    }
}
// validating the uses Input: 
Post.prototype.validation = function(){
    if(this.data.title == ''){this.errors.push('you forgot to fill in the title!')}
    if(this.data.body == ''){this.errors.push('you forgot to fill in the body!')}
}

// creating Post:
Post.prototype.create = function(){
    return new Promise((resolve, reject)=>{
        this.cleanUp()
        this.validation()
        if(!this.errors.length){
            postsCollection.insertOne(this.data).then(info=>{
                resolve(info.ops[0]._id)
            }).catch(()=>{
                reject('Sorry, try again later!')
            })
        }else{
            reject(this.errors)
        }
    })
}

// Updating a post
Post.prototype.update = function(){
    return new Promise(async (resolve, reject)=>{
        try{
            let post = await Post.findSingleById(this.reqdPostId, this.userId)
            if(post.isVisitorOwner){
                let status = await this.safeUpdate()
                resolve(status)
            }else{
                reject()
            }
        }catch{
            reject()
        }
    })
}

// update whe it's safe:
Post.prototype.safeUpdate = function(){
    return new Promise(async (resolve, reject)=>{
        this.cleanUp()
        this.validation()
        if(!this.errors.length){
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.reqdPostId)}, {$set: {title: this.data.title, body: this.data.body}})
            resolve("success")
        }else{
            resolve("failure")
        }
    })
}

// deleting a post
Post.delete = function(reqdPostId, userId){
    return new Promise(async (resolve, reject)=>{
        let post = await Post.findSingleById(reqdPostId, userId)
        if(post.isVisitorOwner){
            await postsCollection.deleteOne({_id: new ObjectID(reqdPostId)})
            resolve()
        }else{
            reject()
        }
    })
}

// a reusable Post Query for Aggregate operations:
Post.reusablePostQuery = function(uniqueOperations, visitorId) {
    return new Promise(async function(resolve, reject) {
        // adding the repetitive data:
      let aggOperations = uniqueOperations.concat([
        {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "userDoc"}},
        {$project: {
          title: 1,
          body: 1,
          createdDate: 1,
          authorId: "$author",
          author: {$arrayElemAt: ["$userDoc", 0]}
        }}
      ])
    //   aggregate operation:
      let posts = await postsCollection.aggregate(aggOperations).toArray()
      // clean up author property in each post object
      posts = posts.map(function(post) {
        //   virifying if the user own the post:
        post.isVisitorOwner = post.authorId.equals(visitorId)
        // getting rid of the author id:
        post.authorId = undefined
        // cleaning the author object
        post.author = {
            username: post.author.username,
            avatar: new User(post.author, true).avatar
        }
  
        return post
      })
      resolve(posts)
    })
  }

// finding the post by its id:
Post.findSingleById = function(id, visitorId){
    return new Promise(async (resolve, reject)=>{
        // checking if the id not scripted:
        if(typeof(id) != "string" || !ObjectID.isValid(id)){
            reject()
            return
        }
        // loking for any posts:
        let posts = await Post.reusablePostQuery([{$match: {_id: new ObjectID(id)}}], visitorId)
        // resolve them if there is any:
        if(posts.length){
            resolve(posts[0])
        }else{
            reject()
        }
    })
}

// looking for a user Posts:
Post.findPostByUserId = function(userId){
    return Post.reusablePostQuery([
        {$match: {author: userId}}, // any post the its author key have a value of X.
        {$sort: {createdDate: -1}}  // sort everything by the createdDate.
    ])
}

// counting the posts:
Post.getPostNumById = function(id){
    return new Promise(async (resolve, reject)=>{
        try{
            let counts = await postsCollection.countDocuments({author: id})
            resolve(counts)
        }catch{
            reject()
        }
    })
}

Post.getFeed = async function(id){
    // getting an array of the users id the the current id followes:
    let flwdIds = await followsCollection.find({followingId: new ObjectID(id)}).toArray()
    flwdIds = flwdIds.map(flwdId=>{
        return flwdId.followedId
    })

    return Post.reusablePostQuery([
        {$match: {author: {$in: flwdIds}}},
        {$sort: {createdDate: -1}}
    ])
}

Post.search = function(searchTerm){
    return new Promise(async (resolve, reject)=>{
        try{
            if(typeof(searchTerm) != 'string'){
                reject()
                return
            }
    
            let posts = await postsCollection.aggregate([
                {$match: {$text: {$search: searchTerm}}},
                {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'userDoc'}},
                {$project: {
                    title: 1,
                    createdDate: 1,
                    author: {$arrayElemAt: ['$userDoc', 0]}
                }},
                {$sort: {score: {$meta: 'textScore'}}}
            ]).toArray()

            posts = posts.map(post=>{
                post.author = {
                    username: post.author.username,
                    avatar: new User(post.author, true).avatar
                }
                return post
            })
    
            resolve(posts)
        }catch{
            reject()
        }
    })
}

module.exports = Post