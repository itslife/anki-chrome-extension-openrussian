class AnkiApiClient {
    async getDeskNamesAsync() {
        return await this.#invoke("deckNames", 6);
    }

    async addSentenceAsync(config, entry) {
        const fields = {};
        fields[config.plainTextField] = entry.text;
        fields[config.translationField] = entry.translation;
        fields[config.htmlTextField] = entry.html;

        return await this.#addOrUpdateNote(config.deckName, config.modelName, fields, config.plainTextField, entry.text)
    }

    async #addOrUpdateNote(deckName, modelName, fields, indexField, indexFieldValue) {
        const ids = await this.#invoke("findNotes", 6, { 
            query: `"deck:${deckName}" "${indexField}:${indexFieldValue}"`
        });

        if (ids && ids.length > 0) {
            const params = {
                "note": {
                    "id": ids[0],
                    "fields": fields
                }
            };
    
            return await this.#invoke("updateNoteFields", 6, params);
        }

        const params = {
            "note": {
                "deckName": deckName,
                "modelName": modelName,
                "fields": fields,
                "options": {
                    "allowDuplicate": false,
                    "duplicateScope": "deck",
                    "duplicateScopeOptions": {
                        "deckName": deckName,
                        "checkChildren": false,
                        "checkAllModels": false
                    }
                }
            }
        };

        return await this.#invoke("addNote", 6, params);
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

class Toast {
    constructor() {
        const div = document.createElement('div');
        div.id = 'snackbar';
        document.body.appendChild(div);
    }
    
    show(msg) {
        var x = document.getElementById("snackbar");
        x.className = "show";
        x.innerHTML = msg;
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
      }
}

class Utils {
    static createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div;
    }

    static insertButton(parentElement, btnTitle, callback) {
        const btn = document.createElement("button");
        btn.innerHTML = btnTitle;
        parentElement.appendChild(btn);

        btn.addEventListener("click", callback);
    }
}

class App {
    #client;
    #config;
    #toast;

    constructor(config) {
        this.#client = new AnkiApiClient();
        this.#config = config;
        this.#toast = new Toast();
    }

    #setupAddSentenceCallback() {
        var sentenceButs = document.querySelectorAll(".star.icon:not(.word-star)");
        if (!sentenceButs) {
            return;
        }

        console.log(sentenceButs);

        sentenceButs.forEach(but => {
            Utils.insertButton(but.parentElement, "Add", async (e) => {
                const elCopy = Utils.createElementFromHTML(e.path[1].innerHTML);

                elCopy.querySelectorAll("a").forEach(a => a.href = a.href);
                elCopy.querySelectorAll("i").forEach(i => i.remove());
                elCopy.querySelectorAll("button").forEach(a => a.remove());

                const enEl = e.path[2].querySelector(".tl");

                const entry = {
                    text: elCopy.innerText.trim(),
                    html: elCopy.innerHTML,
                    translation: enEl.innerText.trim()
                }

                console.log('Importing sentence: ' + entry.text);

                await this.#client.addSentenceAsync(this.#config, entry);
                this.#toast.show('Imported sentence: ' + entry.text);
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

        Utils.insertButton(tabs.parentElement, "Import All", async () => {
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
            
            const elCopy = Utils.createElementFromHTML(sentence.innerHTML);

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

            await this.#client.addSentenceAsync(this.#config, entry);
        }
    }
}

function Run() {
    const config = {
        deckName: "Test2",//"Russian Sentences",
        modelName: "OpenRussian - Sentence",
        plainTextField: "Front",
        translationField: "Back",
        htmlTextField: "BackWithLinks"
    };

    const app = new App(config);
    app.run();
}

Run();
