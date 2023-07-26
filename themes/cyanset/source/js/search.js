(() => {
    
    let searchType = "only-content"
    if (document.getElementById('search-type-toggle')) {
        var bodyEl = document.body
        var SearchTypeToggleEl = document.getElementById('search-type-toggle')
        var options = SearchTypeToggleEl.getElementsByTagName('input')
        for (const option of options) {
            if (option.value == bodyEl.getAttribute('search-type-toggle')) {
                option.checked = true
            }
            option.addEventListener('change', (ev) => {
                var value = ev.target.value
                searchType = value
                for (const o of options) {
                    if (o.value != value) {
                        o.checked = false
                    }
                }
                ev.preventDefault()
                doSearch(searchBox.value)
            })
        }
    }
    var searchIndex = []
    const searchForm = document.getElementById('search-form')
    const searchBox = document.getElementById('searchbox')
    const searchResults = document.getElementById('search-results')

    searchBox.select()

    const doSearch = (keyword) => {

        var results = []
        var resultsEl = []

        for (let i = 0; i < searchIndex.length; i++) {
            //const currentItem = searchIndex[i];
            //deep copy
            const currentItem = JSON.parse(JSON.stringify(searchIndex[i]))
            let currentText = ''
            let searched = -1
            switch (searchType) {
                
                case 'only-content':
                    currentText = JSON.stringify(currentItem.content)
                    searched = currentText.search(keyword)
                    break;
                case 'full':
                    currentText = JSON.stringify(currentItem)
                    searched = currentText.search(keyword)
                    break;
                case 'fuzzy':
                    const keywords = keyword.split(' ')
                    for (let j = 0; j < keywords.length; j++) {
                        const key = keywords[j];
                        currentText = JSON.stringify(currentItem)
                        searched = currentText.search(key)
                        if (searched !== -1) {
                            break;
                        }
                    }
                    break;
                default:
                    break;
                }
            if (searched !== -1) {
                currentItem.content = (() => {
                    const start = searched - 50 > 0 ? searched - 50 : 0
                    const end = searched + 50 < currentText.length ? searched + 50 : currentText.length
                    const content = currentText.substring(start, end)
                    const safecontent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '\n')
                   return safecontent.replace(keyword, `<span class="searched-highlight">${keyword}</span>`)
                })()
                results.push(currentItem)
            }
        }

        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const currentResult = results[i];
                const currentResultEl = document.createElement('article')
                currentResultEl.classList.add('post-list-item')
                currentResultEl.innerHTML = `
        <a href="${currentResult.url}">
            <div class="content">
                ${(() => {
                        if (currentResult.categories) {
                            return `<div class="categories${document.body.attributes['data-uppercase-categories'].value ? ' text-uppercase' : ''}">${(() => {
                                let categories = ''
                                for (let i = 0; i < currentResult.categories.length; i++) {
                                    const currentCategory = currentResult.categories[i]
                                    categories += `<span>${currentCategory}</span>`
                                }
                                return categories
                            })()}</div>`
                        } else {
                            return ''
                        }
                    })()}
        <div class="title">${currentResult.title}</div>
        <div class="excerpt">${currentResult.content}</div>
    </div>
</a>
                `
                resultsEl.push(currentResultEl)
            }
        } else {
            const el = document.createElement('div')
            el.className = 'no-results'
            el.innerHTML = '抱歉，没有找到你所查找的内容'
            resultsEl.push(el)
        }

        searchResults.innerHTML = ''
        for (let i = 0; i < resultsEl.length; i++) {
            const element = resultsEl[i];
            searchResults.appendChild(element)
        }
    }

    searchForm.addEventListener('submit', (ev) => {
        ev.preventDefault()
        if (searchIndex != '') {
            doSearch(searchBox.value)
        } else {
            const el = document.createElement('div')
            el.className = 'no-results'
            el.innerHTML = '稍等，仍在获取索引文件中...'
            searchResults.appendChild(el)
            fetch(document.body.attributes['data-config-root'].value + document.body.attributes['data-search-path'].value).then(res => res.json()).then(data => {
                searchIndex = data
                el.remove()
                doSearch(searchBox.value)
            })
        }
    })
})()