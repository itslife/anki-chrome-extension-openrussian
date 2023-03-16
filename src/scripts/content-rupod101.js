class App {
    #client;
    #config;
    #toast;
    #observer;
    #items;

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

        self.checkNewSentences();
    }

    checkNewSentences() {

        Utils.debounce(() => {
            console.log("Checking supported items...");

            this.#setupMainSentenceCallback();
            this.#setupPopupSentenceCallback();
        })();
    }

    #findItem(text) {
        for(let item of this.#items) {
            if (item.target == text) return item;
        }
    }

    #setupMainSentenceCallback() {
        const divs = document.querySelectorAll("div.CompactWord__box_be6873");
        if (!divs) {
            return;
        }

        divs.forEach(div => {
            const existingBtn = div.querySelector("button.anki-add-btn");
            if (existingBtn) return;

            Utils.insertButton(div, "Add", async (e) => {
                const ruEl = e.path[1].querySelector("div[lang='ru']");
                const enEl = e.path[1].querySelector("div.CompactWord__word_english_f8ea8a");
                if (!ruEl || !enEl) return;
                const text = ruEl.innerText;
                if (!text) return;

                const item = this.#findItem(text);
                if (!item) return;

                const note = {
                    text: item.target,
                    translation: item.english,
                    image: item.image,
                    audio: item.audio
                };

                await this.#addSentence(note);
            });
        });
    }

    #setupPopupSentenceCallback() {
        const divs = document.querySelectorAll("div.WordDetails__sample_a7bbfa");
        if (!divs) {
            return;
        }

        divs.forEach(div => {
            Utils.insertButton(div, "Add", async (e) => {
                const ruEl = e.path[1].querySelector("div[lang='ru']");
                const enEl = e.path[1].querySelector("div.WordDetails__sample_headings_english_b9b834");
                if (!ruEl || !enEl) return;
                const text = ruEl.innerText;
                if (!text) return;
                const item = this.#findItem(text);
                if (!item) return;

                const note = {
                    text: item.target,
                    translation: item.english,
                    image: item.image,
                    audio: item.audio
                };

                await this.#addSentence(note);
            });
        });
    }

    async #addSentence(note) {
        const fields = {
            text: note.text,
            translation: note.translation,
            image: '',
            audio: ''
        };

        const audio = note.audio == undefined ? null : [{
            "url": note.audio,
            "filename": `pod101_${Utils.getFileName(note.audio)}`,
            "fields": [
                "audio"
            ]
        }];
        const image = note.image == undefined ? null : [{
            "url": note.image,
            "filename": `pod101_${Utils.getFileName(note.image)}`,
            "fields": [
                "image"
            ]
        }];

        this.#client.addOrUpdateNote(this.#config.deckName, this.#config.modelName, fields, "text", note.text, audio, image);
        this.#toast.show(`Added sentence ${note.text}`);
    }

    #parseData() {
        var vocabDiv = document.querySelector("div#vocab_page");
        if (!vocabDiv) {
            return;
        }

        const list = JSON.parse(vocabDiv.attributes['data-wordlist'].value);

        const items = [];

        for (let item of list.items) {
            items.push({
                target: item.target.replace('  ', ' '),
                english: item.english,
                audio: item.audio,
                image: item.image
            });

            if (!item.samples) { continue; }

            for (let sample of item.samples) {
                items.push({
                    target: sample.target.replace('  ', ' '),
                    english: sample.english,
                    audio: sample.audio,
                    image: sample.image
                });
            }
        }
        this.#items = items;
    }

    run() {
        this.#parseData();
        this.#setupMainSentenceCallback();
    }
}

function Run() {
    const config = {
        deckName: "pod101",
        modelName: "rupod101"
    };

    const app = new App(config);
    app.run();
}

Run();
