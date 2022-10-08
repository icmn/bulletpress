
(function (factory) {
    this.Dictionary = factory();
}.bind(window, function () {

    const verb_regex = RegExp(/\btype:(verb)?\b/i);
    const len_regex = RegExp(/\blen(?:gth)?:([0-9][0-9]?)?\b/i);
    const leader_regex = RegExp(/\b(?:led|(?:lead(?:er(?:ship)?)?)):(true|y(?:es?)?|false|n(?:o)?)?\b/i);

    let words = null;
    let prevSearchTokens = null;
    let prevResults = null;

    /**
     * 
     * @returns {{ word: string, type: string, strength: number, leadership: boolean }[]}
     */
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

    /**
     * 
     * @param {string} searchstr 
     * @returns {{ word: string, type: string, strength: number, leadership: boolean }[]}
     */
    function cachedSearch(searchstr) {
        debugger;
        let results = prevResults;
        let searchTokens = preprocess_search_args(searchstr);
        if (searchTokens.join(' ') === prevSearchTokens) {
            return results;
        }
        let searchTokenDef = process_cmd_args(searchTokens);
        if (searchTokenDef['searchstr'] !== prevSearchTokens) {
            results = search(searchTokenDef['cmds'], searchTokenDef['plain']);
            prevResults = results; // save off results
            prevSearchTokens = searchTokenDef['searchstr']; // save off terms that created results
        }
        debugger;
        return results;
    }

    /**
     * 
     * @param {string} searchstr 
     * @returns {string[]}
     */
    function preprocess_search_args(searchstr) {
        debugger;
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
     * @returns {{ cmds: string[], plain: string[], searchstr: string }}
     */
    function process_cmd_args(tokens) {
        debugger;
        let tokenDef = { 'cmds': [], 'plain': [], 'searchstr': "" };
        if (Array.prototype !== Object.getPrototypeOf(tokens)) {
            throw TypeError("Invalid parameter type.");
        } else if (tokens.length === 0) {
            return tokenDef;
        }
        // Parse user input for search commands/filters
        let regex_match = null;
        let first_group_matching_regexes = [
            len_regex,
            verb_regex,
            leader_regex
        ];
        tokens.forEach((token) => {
            if (token.includes(":")) {
                cmd_parts = token.split(":")
                if (cmd_parts[cmd_parts.length - 1].length === 0) {
                    // Detected an incomplete command, ignore token
                    return;
                }
                for (let i = 0; i < first_group_matching_regexes.length; i++) {
                    if (!(regex_match = first_group_matching_regexes[i].exec(token))) {
                        continue;
                    }
                    if (regex_match[1] !== undefined || regex_match[1]) {
                        break;
                    }
                    regex_match = null;
                }
                if (!regex_match) return; // Unknown or incomplete command so ignore/drop
                tokenDef['cmds'].push(token);
                return;
            }
            tokenDef['plain'].push(token.toLowerCase());
        });
        tokenDef['searchstr'] = [...tokenDef['cmds'], ...tokenDef['plain']].join(' ');
        return tokenDef;
    }

    /**
     * 
     * @param {string[]} cmdTokens
     * @param {string[]} spellingTokens
     * @returns {{ word: string, type: string, strength: number, leadership: boolean }[]}
     */
    function search(cmdTokens, spellingTokens) {
        if (Array.prototype !== Object.getPrototypeOf(cmdTokens)) {
            throw TypeError("Invalid parameter type for cmdTokens.");
        } else if (Array.prototype !== Object.getPrototypeOf(spellingTokens)) {
            throw TypeError("Invalid parameter type for spellingTokens.");
        } else if ((cmdTokens.length + spellingTokens.length) === 0) {
            return getWordList();
        }
        
        // Determine filters from commands (since preprocessed, cmds should be valid)
        let max_len = null;
        let filter4Verbs = false;
        let filter4leadership = null; // type: null | true | false
        let len_match = null;
        let verb_match = null;
        let leader_match = null;
        debugger;
        cmdTokens.forEach((token) => {
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
                filter4leadership = RegExp(/y(?:es?)?|true/i).test(answer);
                return;
            }
        });

        // Determine filters from basic spelling/regex tokens
        let filter4spelling = "";
        let spellingFilter = null;
        spellingTokens.forEach((token) => {
            filter4spelling += token.toLowerCase();
        });
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
