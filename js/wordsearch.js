
(function (factory) {
    this.Dictionary = factory();
}.bind(window, function () {

    const verb_regex = RegExp(/\btype:verb\b/i);
    const len_regex = RegExp(/\blen(?:gth)?:([0-9][0-9]?)\b/i);
    const leader_regex = RegExp(/\b(?:led|(?:lead(?:er(?:ship)?)?)):(true|yes|false|no)\b/i);

    let words = null;

    const dictionaryObj = Object.freeze({
        get wordList() {
            if (!words) {
                if (VerbsList) {
                    return [
                        ...VerbsList["verbs"]
                    ];
                }
                console.error("VerbsList does not exist.")
                return [];
            }
            return words;
        },
    
        search(searchstr) {
            if (searchstr === undefined || searchstr === null) {
                return wordList;
            } else if (typeof searchstr !== "string") {
                throw TypeError("Invalid parameter type.");
            } else if (searchstr.trim().length === 0) {
                return wordList;
            }
            let max_len = null;
            let filter4Verbs = false;
            let filter4leadership = null; // type: null | true | false
            let filter4spelling = "";
        
            // Parse user input for search commands/filters
            let len_match = null;
            let verb_match = null;
            let leader_match = null;
            const tokens = searchstr.split(/\s+/);
            for (let token in tokens) {
                if (len_match = len_regex.exec(token)) {
                    max_len = Number.parseInt(len_match[1]); // Group 1 = number value
                    continue
                }
                if (verb_match = verb_regex.exec(token)) {
                    filter4Verbs = true;
                    continue
                }
                if (leader_match = leader_regex.exec(token)) {
                    let answer = leader_match[1];
                    filter4leadership = RegExp(/yes|true/i).test(answer);
                    continue
                }
                filter4spelling += token.toLowerCase();
            }
        
            let spellingFilter = null;
            try {
                spellingFilter = RegExp(filter4spelling);
            } catch (err) {} // Ignore filter if regexp parsing fails
        
            const activeFilterFns = [
                (!spellingFilter) ? null : (wordSpec) => spellingFilter.test(wordSpec["word"]),
                (!filter4Verbs) ? null : (wordSpec) => wordSpec["type"] === "verb",
                (filter4leadership !== null) ? null : (wordSpec) => wordSpec["leadership"] === filter4leadership,
                (max_len !== null) ? null : (wordSpec) => wordSpec["word"].length === max_len
            ].filter((func) => func !== null);
        
            // generate resulting filtered wordlist definitions
            return wordList.filter((wordDef) => {
                let allowed;
                for (let filterFn in activeFilterFns) {
                    allowed = filterFn(wordDef);
                    if (!allowed) return false;
                }
                return true;
            });
        }
    });

    return dictionaryObj;
}))();
