class App {
    #client;
    #config;
    #toast;
    #observer;

    constructor(config) {
        this.#client = new AnkiApiClient();
        this.#config = config;
        this.#toast = new Toast();

        this.#observer = new MutationObserver((list, ob) => this.#checkDomUpdates(list, ob, this));

        const observeConfig = { childList: true, subtree: true };
        this.#observer.observe(document, observeConfig);
    }

    #checkDomUpdates(mutationList, observer, self) {
        var hasNewNode = false;

        for (const mutation of mutationList) {
            if (mutation.type !== 'childList') return;

            const nodeList = mutation.addedNodes;
            if (!nodeList || nodeList.length < 1) return;

            hasNewNode = true;
            break;
        }

        if (!hasNewNode) return;

        self.checkDomForUpdates();
    }

    checkDomForUpdates() {

        Utils.debounce(() => {
            console.log("Checking supported items...");

            this.run();
        })();
    }

    #setupAddSentenceCallback() {
        var sentenceButs = document.querySelectorAll(".star.icon:not(.word-star)");
        if (!sentenceButs) {
            return;
        }

        sentenceButs.forEach(but => {
            Utils.insertButton(but.parentElement, "Add", async (e) => {
                const parentNode = e.currentTarget.parentNode;
                const elCopy = Utils.createElementFromHTML(parentNode.innerHTML);

                elCopy.querySelectorAll("a").forEach(a => a.href = a.href);
                elCopy.querySelectorAll("i").forEach(i => i.remove());
                elCopy.querySelectorAll("button").forEach(a => a.remove());

                const enEl = parentNode.parentNode.querySelector(".tl");

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

        wordBut.addEventListener("click", () => {
            console.log("wordBut");
        });
    }

    #setupImportSentencesButton() {
        const tabs = document.querySelector("div.words-sentences-tabs");
        if (!tabs) { return; }

        const tab = document.querySelector("a.active[href='/mywords?sentences']");
        if (!tab) { return; }

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
