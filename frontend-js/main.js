import Search from "./modules/search"
import Chat from "./modules/chat"
import Registration from "./modules/registration-form"

if(document.querySelector('#registration-form')){
    new Registration()
}

if(document.querySelector('#chat-wrapper')){
    new Chat()
}

if(document.querySelector('.header-search-icon')){
    new Search()
}
