import axios from 'axios'
import domPurify from 'dompurify'

export default class Search{
    constructor(){
        // Varibales and inisializing the events:
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.body = document.querySelector('body')
        this.injectHTML()
        this.openIcon = document.querySelector('.header-search-icon')
        this.closeIcon = document.querySelector('.close-live-search')
        this.search = document.querySelector('.search-overlay')
        this.searchField = document.querySelector('#live-search-field')
        this.result = document.querySelector('.live-search-results')
        this.circleLoader = document.querySelector('.circle-loader')
        this.previousValue = ""
        this.typingTiming

        this.event()
    }
    // events:
    event(){
        this.openIcon.addEventListener('click', () => this.openSearch())
        this.closeIcon.addEventListener('click', (e) => {
            e.preventDefault()
            this.closeSearch()
        })
        this.searchField.addEventListener('keyup', ()=> this.keyPressHandler())
    }


    // methods:
    // key press handleing:
        // when to send the async request:
    keyPressHandler(){
        let value = this.searchField.value

        if(value == ""){
            this.closeLoader()
            this.closeResult()
            clearTimeout(this.typingTiming)
        }

        if(value != 0 && value != this.previousValue){
            clearTimeout(this.typingTiming)
            this.openLoader()
            this.closeResult()
            this.typingTiming = setTimeout(()=>{this.sendRequest()}, 440)
        }

        this.previousValue = value
    }

    // sending the request:
    sendRequest(){
        axios.post('/search', {_csrf: this._csrf, searchTerm: this.searchField.value}).then(response=>{
            console.log(response.data)
            this.printData(response.data)
        }).catch(()=>{
            alert('we run into a problem')
        })
    }

    // Print the posts in the result:
    printData(posts){
        if(posts.length){
            this.result.innerHTML = domPurify.sanitize(`
            <div class="list-group shadow-sm">
                <div class="list-group-item active"><strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items`: "1 item"} found)</div>
                ${posts.map(post=>{
                    let postDate = new Date(post.createdDate)
                    return `
                        <a href="/post/${post._id}" class="list-group-item list-group-item-action">
                            <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
                            <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth() + 1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
                        </a>`
                }).join("")}
            </div>`)
        }else{
            this.result.innerHTML = `<div class="text-center alert alert-danger">there is no result for ${this.searchField.value}</div>`
        }
        this.closeLoader()
        this.openResult()
    }

    // show&close the search result:
    openResult(){this.result.classList.add('live-search-results--visible')}
    closeResult(){this.result.classList.remove('live-search-results--visible')}

    // show&close the circle-loader:
    openLoader(){this.circleLoader.classList.add('circle-loader--visible')}
    closeLoader(){this.circleLoader.classList.remove('circle-loader--visible')}

    // search open and close:
    openSearch(){
        this.search.classList.add('search-overlay--visible')
        setTimeout(() => {this.searchField.focus()}, 50);
    }
    closeSearch(){this.search.classList.remove('search-overlay--visible')}


    // the search injection:
    injectHTML(){
        this.body.insertAdjacentHTML('beforeend', `  <!-- search feature begins -->
        <div class="search-overlay">
          <div class="search-overlay-top shadow-sm">
            <div class="container container--narrow">
              <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
              <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
              <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
            </div>
          </div>
      
          <div class="search-overlay-bottom">
            <div class="container container--narrow py-3">
              <div class="circle-loader"></div>
              <div class="live-search-results"></div>
            </div>
          </div>
        </div>`)
    }

}