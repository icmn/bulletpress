
(function (factory) {
    this.Dictionary = factory();
}.bind(window, function () {

    const verb_regex = RegExp(/\btype:(verb)?\b/i);
    const len_regex = RegExp(/\blen(?:gth)?:([0-9][0-9]?)?\b/i);
    const leader_regex = RegExp(/\b(?:led|(?:lead(?:er(?:ship)?)?)):(true|yes|false|no)?\b/i);

    let words = null;
    let prevSearchTokens = null;
    let prevResults = null;

    function getWordList() {
        if (words === null) {
            words = [];
            if (VerbsList) {
                words = [
                    ...VerbsList["verbs"]
                ];
            } else {
                console.error("VerbsList does not exist.")
            }
        }
        return words;
    }

    function cachedSearch(searchstr) {
        let results = prevResults;
        let searchTokens = preprocess_search_args(searchstr);
        if (searchTokens.join(" ") !== prevSearchTokens) {
            results = search(searchTokens);
            prevResults = results; // save off results
            prevSearchTokens = searchTokens.join(" "); // save off terms that created results
        }
        return results;
    }

    /**
     * 
     * @param {string} searchstr 
     * @returns string[]
     */
    function preprocess_search_args(searchstr) {
        if (searchstr === undefined || searchstr === null) {
            return [];
        } else if (typeof searchstr !== "string") {
            throw TypeError("Invalid parameter type.");
        } else if (searchstr.trim().length === 0) {
            return [];
        }
        return searchstr.trim().replace(/\s*:\s*/g, ':').split(/\s+/);
    }

    /**
     * 
     * @param {string[]} tokens 
     * @returns 
     */
    function search(tokens) {
        debugger;
        if (Array.prototype !== Object.getPrototypeOf(tokens)) {
            throw TypeError("Invalid parameter type.");
        } else if (tokens.length === 0) {
            return getWordList();
        }
        let max_len = null;
        let filter4Verbs = false;
        let filter4leadership = null; // type: null | true | false
        let filter4spelling = "";
    
        // Parse user input for search commands/filters
        let len_match = null;
        let verb_match = null;
        let leader_match = null;
        tokens.forEach((token) => {
            if (token.includes(":")) {
                cmd_parts = token.split(":")
                if (cmd_parts[cmd_parts.length - 1].length === 0) {
                    // Detecting an incomplete command
                    return;
                }
                if (len_match = len_regex.exec(token)) {
                    if (!len_match[1] || false) return;
                    max_len = Number.parseInt(len_match[1]); // Group 1 = number value
                    return;
                }
                if (verb_match = verb_regex.exec(token)) {
                    if (!verb_match[1] || false) return;
                    filter4Verbs = true;
                    return;
                }
                if (leader_match = leader_regex.exec(token)) {
                    let answer = leader_match[1];
                    if (!answer) return;
                    filter4leadership = RegExp(/yes|true/i).test(answer);
                    return;
                }
            }
            filter4spelling += token.toLowerCase();
        });
    
        let spellingFilter = null;
        if (filter4spelling.length > 0) {
            try {
                spellingFilter = RegExp(filter4spelling);
            } catch (err) {} // Ignore filter if regexp parsing fails
        }
    
        const activeFilterFns = [
            (!spellingFilter) ? null : (wordSpec) => spellingFilter.test(wordSpec["word"]),
            (!filter4Verbs) ? null : (wordSpec) => wordSpec["type"] === "verb",
            (filter4leadership === null) ? null : (wordSpec) => wordSpec["leadership"] === filter4leadership,
            (max_len === null) ? null : (wordSpec) => wordSpec["word"].length === max_len
        ].filter((func) => func !== null);
    
        // generate resulting filtered wordlist definitions
        return getWordList().filter((wordDef) => {
            let allowed;
            let filterFn;
            for (let i = 0; i < activeFilterFns.length; i++) {
                filterFn = activeFilterFns[i];
                allowed = filterFn(wordDef);
                if (!allowed) return false;
            }
            return true;
        });
    }

    return Object.freeze({
        get wordList() { return getWordList(); },
        search(searchstr) { return cachedSearch(searchstr); }
    });

}))();
