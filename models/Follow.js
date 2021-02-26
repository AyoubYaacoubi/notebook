
// requirements:
const followsCollection = require('../db').db().collection('follows')
const usersCollection = require('../db').db().collection('users')
const ObjectID = require('mongodb').ObjectID
const User = require('./User')

let Follow = function(flwdUsrn, ffUserId){
    this.flwdUsrn = flwdUsrn
    this.ffUserId = ffUserId
    this.errors = []
}

// cleaning up the users data: 
Follow.prototype.cleanUp = function(){
    if(typeof(this.flwdUsern) != "string"){this.flwdUsern = ""}
}

// validating the users data:
Follow.prototype.validation = async function(action){
    // seeing if the user even exist:
    let flwdAcct = await usersCollection.findOne({username: this.flwdUsrn})
    
    // if yes then save the account id in a variable:
    if(flwdAcct){
        this.flwdAcctId = flwdAcct._id
    }else{ // if now push an error:
        this.errors.push('this user does not exist!')
    }
    // you should not follow some you already following or unfollow someone you do not follow.
    let flwInfo = await followsCollection.findOne({followedId: this.flwdAcctId, followingId: new ObjectID(this.ffUserId)})

    // if the user trying to follow, see if he's already following.
    if(action == "create"){if(flwInfo){this.errors.push('you already following this user!')}}
    // if the user trying to unfollow, see if he's even following.
    if(action == "delete"){if(!flwInfo){this.errors.push('you do not follow this user!')}}
    // you should not follow yourself:
    if(this.flwdAcctId.equals(this.ffUserId)){this.errors.push('this cannot be done!')}
}

// following an Account:
Follow.prototype.create = function(){
    return new Promise(async (resolve, reject)=>{
        // cleaning and validating:
        this.cleanUp()
        await this.validation("create")
        // if there is no errors then save the follow infos:
        if(!this.errors.length){
            await followsCollection.insertOne({followedId: this.flwdAcctId, followingId: new ObjectID(this.ffUserId)})
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

// unfollowing an Account:
Follow.prototype.delete = function(){
    return new Promise(async (resolve, reject)=>{
        // cleaning up and validating:
        this.cleanUp()
        await this.validation("delete")
        // if there is no errors then remove the follow.
        if(!this.errors.length){
            await followsCollection.deleteOne({followedId: this.flwdAcctId, followingId: new ObjectID(this.ffUserId)})
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

// seeing if the user follow the current acount:
Follow.isVisitorFollowing = async function(flwdUsrId, usrId){
    let flwDoc = await followsCollection.findOne({followedId: flwdUsrId, followingId: new ObjectID(usrId)})
    if(flwDoc){
        return true
    }else{
        return false
    }
}

// getting the followers for the profile:
Follow.getFollowersById = function(id){
    return new Promise(async (resolve, reject)=>{
        try{
            // getting the followings infos (username & avatar)
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}}, 
                {$lookup: {from: 'users', localField: 'followingId', foreignField: '_id', as: 'flwDoc'}},
                {$project: {
                    username: {$arrayElemAt: ['$flwDoc.username', 0]},
                    email: {$arrayElemAt: ['$flwDoc.email', 0]}
                }}
            ]).toArray()
            // filtering the data and getting the avatar
            followers = followers.map(follower=>{
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })
            resolve(followers)
        }catch{
            reject()
        }

    })
}

Follow.getFollowingById = function(id){
    return new Promise(async (resolve, reject)=>{
        try{
            // getting the followings infos (username & avatar)
            let following = await followsCollection.aggregate([
                {$match: {followingId: id}},
                {$lookup: {from: 'users', localField: 'followedId', foreignField: '_id', as: 'flwDoc'}},
                {$project: {
                    username: {$arrayElemAt: ["$flwDoc.username", 0]},
                    email: {$arrayElemAt: ["$flwDoc.email", 0]}
                }}
            ]).toArray()
            // filtering the data and getting the avatar
            following = following.map(flw=>{
                let user = new User(flw, true)
                return {username: flw.username, avatar: user.avatar}
            })
            resolve(following)
        }catch{
            reject()
        }
    })
}

Follow.getFlwrsNumById = function(id){
    return new Promise(async (resolve, reject)=>{
        try{
            let counts = await followsCollection.countDocuments({followedId: id})
            resolve(counts)
        }catch{
            reject()
        }
    })
}

Follow.getFlwingNumById = function(id){
    return new Promise(async (resolve, reject)=>{
        try{
            let counts = await followsCollection.countDocuments({followingId: id})
            resolve(counts)
        }catch{
            reject()
        }
    })
}

module.exports = Follow