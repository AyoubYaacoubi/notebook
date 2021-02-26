import axios from 'axios'

export default class Registration{
    constructor(){
        // variables and initializing the events:
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.form = document.querySelector("#registration-form")
        this.allFields = document.querySelectorAll('#registration-form .form-control')
        this.username = document.querySelector("#username-register")
        this.username.previousValue = ""
        this.email = document.querySelector('#email-register')
        this.email.previousValue = ""
        this.password = document.querySelector('#password-register')
        this.password.previousValue = ""
        this.username.isUnique = false
        this.email.isUnique = false
        this.injectHTML()
        this.event()
    }
    // Events:
    event(){
        // form
        this.form.addEventListener('submit', e => {
            e.preventDefault()
            this.formValidation()
        })
        // keyup:
        this.username.addEventListener('keyup', ()=> {
            this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener('keyup', ()=>{
            this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener('keyup', ()=>{
            this.isDifferent(this.password, this.passwordHandler)
        })
        // blur:
        this.username.addEventListener('blur', ()=> {
            this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener('blur', ()=>{
            this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener('blur', ()=>{
            this.isDifferent(this.password, this.passwordHandler)
        })
    }
    // Methods:
    formValidation(){
        this.usernameImediateValidation()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordImediateValidation()
        this.passwordAfterDelay()
        if(
            this.username.isUnique &&
            this.email.isUnique &&
            !this.username.errors &&
            !this.email.errors &&
            !this.password.errors
        ){
            this.form.submit()
        }
    }



    // base is different for the fields:
    isDifferent(el, handler){
        if(el.previousValue != el.value){
            handler.call(this)
        }

        el.previousValue = el.value
    }
    
    // validating the username:=============
    // handeling the value:
    usernameHandler(){
        this.username.errors = false
        this.usernameImediateValidation()
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(()=> {this.usernameAfterDelay()}, 800)
    }
    // imediate validation:
    usernameImediateValidation(){
        if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)){
            this.showValidation(this.username, "username can contain only letters!")
        }
        if(this.username.value.length > 30){
            this.showValidation(this.username, "username should't exceed 30 letters!")
        }
        if(!this.username.errors){
            this.hideValidation(this.username)
        }
    }

    // after Stop:
    usernameAfterDelay(){
        if(this.username.value.length < 3){
            this.showValidation(this.username, "username must be at least 3 letters!")
        }
        if(!this.username.errors){
            axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.username.value}).then((response)=>{
                if(response.data){
                    this.showValidation(this.username, "this username already exist!")
                    this.username.isUnique = false
                }else{
                    this.username.isUnique = true
                }
            }).catch(()=>{
                console.log("please, try again later!")
            })
        }
    }

    // validating the email:=============
    emailHandler(){
        this.email.errors = false
        clearTimeout(this.email.timer)
        this.email.timer = setTimeout(()=> this.emailAfterDelay(), 1000)
    }

    emailAfterDelay(){
        if(!/^\S+@\S+$/.test(this.email.value)){
            this.showValidation(this.email, "you must provide a valid email!")
        }

        if(!this.email.errors){
            axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.email.value}).then(response=>{
                if(response.data){
                    this.email.isUnique = false
                    this.showValidation(this.email, "this Email is already been used!")
                }else{
                    this.email.isUnique = true
                    this.hideValidation(this.email)
                }
            }).catch(()=>{
                console.log("please try gain later")
            })
        }
        
    }
    // validating the password:=============
    passwordHandler(){
        this.password.errors = false
        this.passwordImediateValidation()
        clearTimeout(this.password.timer)
        this.password.timer = setTimeout(()=> this.passwordAfterDelay(), 800)
    }

    passwordImediateValidation(){
        if(this.password.value.length > 50){
            this.showValidation(this.password, "password should not exceed 50 letters!")
        }
        if(!this.password.errors){
            this.hideValidation(this.password)
        }
    }

    passwordAfterDelay(){
        if(this.password.value.length < 10){
            this.showValidation(this.password, "password must contain more than 10 letters!")
        }
    }


    // displaying the errors with a message or hiding it:========
    showValidation(el, message){
        el.nextElementSibling.innerHTML = message
        el.nextElementSibling.classList.add('liveValidateMessage--visible')
        el.errors = true
    }

    hideValidation(el){
        el.nextElementSibling.classList.remove('liveValidateMessage--visible')
    }

    injectHTML(){
        this.allFields.forEach(el=>{
            el.insertAdjacentHTML('afterend', `<div class="alert alert-danger small liveValidateMessage "></div>`)
        })
    }
}