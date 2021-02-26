import DOMPurify from 'dompurify'

export default class Chat{
    constructor(){
        // variables and initializing the events:
        this.chatWrapper = document.querySelector('#chat-wrapper')
        this.openedYet = false
        this.injectHTML()
        this.chatIcon = document.querySelector('.header-chat-icon')
        this.chatIconClose = document.querySelector('.chat-title-bar-close')
        this.chatField = document.querySelector('#chatField')
        this.chatForm = document.querySelector('#chatForm')
        this.chatLog = document.querySelector('#chat')
        this.event()
    }
    // evens:
    event(){
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault()
            this.sendMessageToServer()
        } )
        this.chatIcon.addEventListener('click', ()=> this.openChat())
        this.chatIconClose.addEventListener('click', ()=> this.closeChat())
    }

    // methods:
    sendMessageToServer(){
        if(this.chatField.value.trim().length >= 1){
            this.socket.emit('messageFromBrowser', {message: this.chatField.value})
            this.displayMessageFromBrowser()
            this.chatField.value = ''
            this.chatField.focus()
            this.chatLog.scrollTop = this.chatLog.scrollHeight
        }
    }

    // displaying the message from the browser:
    displayMessageFromBrowser(){
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-self">
            <div class="chat-message">
            <div class="chat-message-inner">
                ${this.chatField.value}
            </div>
            </div>
            <img class="chat-avatar avatar-tiny" src="${this.avatar}">
        </div>
    `))
    }


    // close&open chat:
    closeChat(){this.chatWrapper.classList.remove('chat--visible')}
    openChat(){
        if(!this.openedYet){
            this.openConnection()
        }
        this.openedYet = true
        this.chatWrapper.classList.add('chat--visible')
        this.chatField.focus()
    }

    // opening the connection Secet.IO
    openConnection(){
        // connecting:
        this.socket = io()
        // saving the avatar
        this.socket.on('welcome', (data)=>{
            this.avatar = data.avatar
        })
        // getting the message from the server:
        this.socket.on("messageFromServer", (data)=>{
            this.displayMessageFromServer(data)
        })
    }

    // displaying the message from the server:
    displayMessageFromServer(data){
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-other">
            <a href="/profile/${data.username}"><img class="avatar-tiny" src="${data.avatar}"></a>
            <div class="chat-message"><div class="chat-message-inner">
            <a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
            ${data.message}
            </div></div>
        </div>
    `))
        this.chatLog.scrollTop = this.chatLog.scrollHeight
    }

    // injection :
    injectHTML(){
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>
        
        <form id="chatForm" class="chat-form border-top">
            <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }

}