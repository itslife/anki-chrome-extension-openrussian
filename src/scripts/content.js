class AnkiApiClient {
    async getDeskNamesAsync() {
        return await this.#invoke("deckNames", 6);
    }

    async addSentenceAsync(deck, entry) {
        const ids = await this.#invoke("findNotes", 6, { 
            query: `deck:${deck} "front:${entry.text}"`
        });

        if (ids && ids.length > 0) {
            const params = {
                "note": {
                    "id": ids[0],
                    "fields": {
                        "Front": entry.text,
                        "Back": entry.translation,
                        "BackWithLinks": entry.html
                    }
                }
            };
    
            return await this.#invoke("updateNoteFields", 6, params);
        } else {
            const params = {
                "note": {
                    "deckName": deck,
                    "modelName": "OpenRussian - Sentence",
                    "fields": {
                        "Front": entry.text,
                        "Back": entry.translation,
                        "BackWithLinks": entry.html
                    },
                    "options": {
                        "allowDuplicate": false,
                        "duplicateScope": "deck",
                        "duplicateScopeOptions": {
                            "deckName": deck,
                            "checkChildren": false,
                            "checkAllModels": false
                        }
                    }
                }
            };
    
            return await this.#invoke("addNote", 6, params);
        }  
    }

    #invoke(action, version, params = {}) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('error', () => reject('failed to issue request'));
            xhr.addEventListener('load', () => {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (Object.getOwnPropertyNames(response).length != 2) {
                        throw 'response has an unexpected number of fields';
                    }
                    if (!response.hasOwnProperty('error')) {
                        throw 'response is missing required error field';
                    }
                    if (!response.hasOwnProperty('result')) {
                        throw 'response is missing required result field';
                    }
                    if (response.error) {
                        throw response.error;
                    }
                    resolve(response.result);
                } catch (e) {
                    reject(e);
                }
            });

            xhr.open('POST', 'http://127.0.0.1:8765');
            xhr.send(JSON.stringify({ action, version, params }));
        });
    }
}

class App {
    #client;
    #deckName;

    constructor(deckName) {
        this.#client = new AnkiApiClient();
        this.#deckName = deckName;
    }

    #createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div;
    }

    #setupAddSentenceCallback() {
        var sentenceButs = document.querySelectorAll(".star.icon:not(.word-star)");
        if (!sentenceButs) {
            return;
        }

        console.log(sentenceButs);

        sentenceButs.forEach(but => {
            but.addEventListener("click", async (e) => {
                console.log(e);

                const ruEl = this.#createElementFromHTML(e.path[1].innerHTML);

                ruEl.querySelectorAll("a").forEach(a => a.href = a.href);
                ruEl.querySelectorAll("i").forEach(i => i.remove());
                ruEl.querySelectorAll("button").forEach(a => a.remove());

                const enEl = e.path[2].querySelector(".tl");

                const entry = {
                    text: ruEl.innerText.trim(),
                    html: ruEl.innerHTML,
                    translation: enEl.innerText.trim()
                }

                console.log(entry);

                await this.#client.addSentenceAsync(this.#deckName, entry);
            });
        }
        );
    }

    #setupAddWordCallback() {
        var wordBut = document.querySelector(".star.icon.word-star");
        if (!wordBut) {
            return;
        }

        console.log(wordBut);

        wordBut.addEventListener("click", () => {
            console.log("wordBut");
        });
    }

    #setupImportSentencesButton() {
        const tabs = document.querySelector("div.words-sentences-tabs");
        if (!tabs) {return;}

        const tab = document.querySelector("a.active[href='/mywords?sentences']");
        if (!tab) {return;}

        const btn = document.createElement("button");
        btn.innerHTML = "Import All";
        tabs.parentElement.appendChild(btn);

        btn.addEventListener("click", async () => {
            await this.#importAllSentences();
        });
    }

    run() {
        this.#setupAddSentenceCallback();
        this.#setupAddWordCallback();
        this.#setupImportSentencesButton();
    }

    async #importAllSentences() {
        console.log('Importing all sentences...');

        var sentences = document.querySelectorAll("li.sentence");
        if (!sentences) {
            return;
        }

        console.log('Sentences found:' + sentences.length);

        for (let index = 0; index < sentences.length; index++) {
            const sentence = sentences[index];
            
            const elCopy = this.#createElementFromHTML(sentence.innerHTML);

            elCopy.querySelectorAll("a").forEach(a => a.href = a.href);
            elCopy.querySelectorAll("i").forEach(i => i.remove());
            elCopy.querySelectorAll("button").forEach(a => a.remove());

            const ruEl = elCopy.querySelector(".ru");
            const enEl = elCopy.querySelector(".tl");

            const entry = {
                text: ruEl.innerText.trim(),
                html: ruEl.innerHTML,
                translation: enEl.innerText.trim()
            }

            console.log('Importing sentence: ' + entry.text);

            await this.#client.addSentenceAsync(this.#deckName, entry);
        }
    }
}

function Run() {
    const app = new App("Test2");
    app.run();
}

Run();
