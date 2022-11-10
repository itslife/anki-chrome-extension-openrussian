class AnkiApiClient {
    async getDeskNamesAsync() {
        return await this.#invoke("deckNames", 6);
    }

    async addSentenceAsync(config, entry) {
        const fields = {};
        fields[config.plainTextField] = entry.text;
        fields[config.translationField] = entry.translation;
        fields[config.htmlTextField] = entry.html;

        return await this.addOrUpdateNote(config.deckName, config.modelName, fields, config.plainTextField, entry.text)
    }

    async addOrUpdateNote(deckName, modelName, fields, indexField, indexFieldValue, audio = [], picture = []) {
        const ids = await this.#invoke("findNotes", 6, {
            query: `"deck:${deckName}" "${indexField}:${indexFieldValue}"`
        });

        if (ids && ids.length > 0) {
            const params = {
                "note": {
                    "id": ids[0],
                    "fields": fields,
                    "audio": audio,
                    "picture": picture
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
                },
                "audio": audio,
                "picture": picture
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
        setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
    }
}

class Utils {
    static createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div;
    }

    static insertButton(parentElement, btnTitle, callback) {
        const existingBtn = parentElement.querySelector("button.anki-add-btn");
        if (existingBtn) return;

        const btn = document.createElement("button");
        btn.classList = ["anki-add-btn"]
        btn.innerHTML = btnTitle;
        parentElement.appendChild(btn);

        btn.addEventListener("click", callback);
    }

    static htmlDecode(input) {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    }

    static debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    static getFileName(url) {
        return url.substring(url.lastIndexOf('/')+1);
    }
}