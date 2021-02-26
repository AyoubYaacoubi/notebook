// some requirements:
const usersCollection = require('../db').db().collection('users')
const validator = require('validator')
const md5 = require('md5')
const bcrypt = require('bcryptjs')

// establising the blue print
let User = function(d, gA){
    this.data = d
    this.errors = []
    if(gA){this.getAvatar()} // if we asked for the avatar, give it.
    if(gA == undefined){gA = false} // if we did not define it set it to false.
}

// cleaning the users data:
User.prototype.cleanUp = function(){
    if(typeof(this.data.username) != 'string'){this.data.username = ""}
    if(typeof(this.data.email) != 'string'){this.data.email = ""}
    if(typeof(this.data.password) != 'string'){this.data.password = ""}
    // getting rid of bugs:
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}


// validating the data: 
User.prototype.validation = function(){
    return new Promise(async (resolve, reject)=>{
        // username validation:
        if(this.data.username == ''){this.errors.push('you forgot to provide your username!')}
        if(this.data.username != '' && !validator.isAlphanumeric(this.data.username)){this.errors.push('your username must contain only letters and numbers!')}
        if(this.data.username.length > 0 && this.data.username.length < 3){this.errors.push('your username must contain at least 3 letters!')}
        if(this.data.username.length > 3 && this.data.username.length > 30){this.errors.push('your username sould not contain more than 30 letters!')}
        // email validation:
        if(this.data.email == ''){this.errors.push('you forgot to provide you email!')}
        if(this.data.email != '' && !validator.isEmail(this.data.email)){this.errors.push('you have to provide a valid email!')}
        // password validation:
        if(this.data.password == ''){this.errors.push('you have to provide a password!')}
        if(this.data.password.length > 0 && this.data.password.length < 10){this.errors.push('your password must contain at least 10 letters!')}
        if(this.data.password.length > 10 && this.data.password.length > 50){this.errors.push('your password sould not contain more than 50 letters!')}
        // checking avaliability:
        // if the username exist:
        if(this.data.username == '' && this.data.username.length >= 3 && validator.isAlphanumeric(this.data.username)){
            let usernameExist = await usersCollection.findOne({username: this.data.username})
            if(usernameExist){
                this.errors.push('this username already exist!')
            }
        }
        // if the email exist:
        if(this.data.email == '' && validator.isEmail(this.data.email)){
            let emailExist = await usersCollection.findOne({email: this.data.email})
            if(emailExist){
                this.errors.push('this email is already been used!')
            }
        }
        resolve()
    })
}

// logging in the users: 
User.prototype.login = function(){
    return new Promise((resolve, reject)=>{
        this.cleanUp()
        // see if the username even exist than check the password or reject:
        usersCollection.findOne({username: this.data.username}).then(attemptedUser=>{
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
                this.data = attemptedUser // to set the session data.
                this.getAvatar() // to set the session data
                resolve()
            }else{
                reject('Sorry, wrong password or username!')
            }
        }).catch(function(){
            reject('Sorry, try again later!')
        })
    })
}

// registering the user:
User.prototype.register = function(){
    return new Promise(async (resolve, reject)=>{
        // cleaning & validating the data:
        this.cleanUp()
        await this.validation()
        // if there is no errors:
        if(!this.errors.length){
            // hash the password:
            let salt = bcrypt.genSaltSync(9)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            // save the data in the database:
            await usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

// getting the users Avatar:
User.prototype.getAvatar = function(){
    this.avatar = `https://www.gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

// finding the use shared info by his username:
User.findByUsername = function(username){
    // cheking if the username not scripted:
    return new Promise(async (resolve, reject)=>{
        if(typeof(username) != 'string'){
            reject()
            return
        }
        // looking in our database:
        await usersCollection.findOne({username: username}).then(userDoc=>{
            // if it does exist:
            if(userDoc){
                // get the avatar:
                userDoc = new User(userDoc, true)
                // and get just the needed informations:
                userDoc = {
                    id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                resolve(userDoc)
            }else{
                reject()
            }
        }).catch(()=>{
            reject()
        })

    })
}

User.findByEmail = function(email){
    return new Promise(async (resolve, reject)=>{
        if(typeof(email) != 'string'){
            resolve(false)
            return
        }
        let emailBool = await usersCollection.findOne({email: email})
        if(emailBool){
            resolve(true)
        }else{
            resolve(false)
        }
    })
}

module.exports = User