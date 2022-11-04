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
        deckName: "Russian Sentences",
        modelName: "OpenRussian - Sentence",
        plainTextField: "Front",
        translationField: "Back",
        htmlTextField: "BackWithLinks"
    };

    const app = new App(config);
    app.run();
}

Run();
