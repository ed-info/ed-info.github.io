import{a as e,i as t,n,o as r,r as i,s as a}from"./BinaryModule-DMhzYB6c-yQ7-Asoa.js";function o(e){switch(e){case`plaintext`:return i.Plain;case`typst`:return i.Typst;case`markdown`:case void 0:return i.Markdown;default:return console.warn(`Unknown Harper language '${String(e)}'; using markdown.`),i.Markdown}}function s(e,t){return[e,o(t?.language),t?.forceAllHeadings??!1,t?.regex_mask,t?.dedup??!0,t?.isolateEnglish??!1]}var c=class{binary;inner;disposed=!1;constructor(e){this.binary=e.binary,this.binary.setup(),this.inner=this.createInner(e.dialect)}createInner(e){return t.from(async()=>(await this.binary.setup(),this.binary.createLinter(e)))}async setup(){await this.lint(``,{language:`plaintext`});let e=await this.exportIgnoredLints();await this.importIgnoredLints(e)}async lint(e,t){return(await this.inner).lint(...s(e,t))}async organizedLints(e,t){let n=(await this.inner).organized_lints(...s(e,t)),r={};for(let e of n)r[e.group]=e.lints,e.free();return r}async applySuggestion(e,t,n){return(await this.inner).apply_suggestion(e,t,n)}async isLikelyEnglish(e){return(await this.inner).is_likely_english(e)}async isolateEnglish(e){return(await this.inner).isolate_english(e)}async getLintConfig(){return(await this.inner).get_lint_config_as_object()}async getDefaultLintConfigAsJSON(){return await this.binary.getDefaultLintConfigAsJSON()}async getDefaultLintConfig(){return await this.binary.getDefaultLintConfig()}async getStructuredLintConfig(){return(await this.inner).get_structured_lint_config_as_object()}async getStructuredLintConfigJSON(){return(await this.inner).get_structured_lint_config_as_json()}async setLintConfig(e){(await this.inner).set_lint_config_from_object(e)}async getLintConfigAsJSON(){return(await this.inner).get_lint_config_as_json()}async setLintConfigWithJSON(e){(await this.inner).set_lint_config_from_json(e)}async toTitleCase(e){return await this.binary.toTitleCase(e)}async getLintDescriptions(){return(await this.inner).get_lint_descriptions_as_object()}async getLintDescriptionsAsJSON(){return(await this.inner).get_lint_descriptions_as_json()}async getLintDescriptionsHTML(){return(await this.inner).get_lint_descriptions_html_as_object()}async getLintDescriptionsHTMLAsJSON(){return(await this.inner).get_lint_descriptions_html_as_json()}async ignoreLint(e,t){return await this.ignoreLints(e,[t])}async ignoreLints(e,t){(await this.inner).ignore_lints(e,t)}async ignoreLintHash(e){(await this.inner).ignore_hashes(new BigUint64Array([e]))}async exportIgnoredLints(){return(await this.inner).export_ignored_lints()}async importIgnoredLints(e){(await this.inner).import_ignored_lints(e)}async contextHash(e,t){return(await this.inner).context_hash(e,t)}async clearIgnoredLints(){(await this.inner).clear_ignored_lints()}async clearWords(){return(await this.inner).clear_words()}async importWords(e){return(await this.inner).import_words(e)}async exportWords(){return(await this.inner).export_words()}async getDialect(){return(await this.inner).get_dialect()}async setDialect(e){let t=await this.inner;return t.get_dialect()!==e&&(t.free(),this.inner=this.createInner(e)),Promise.resolve()}async summarizeStats(e,t){return(await this.inner).summarize_stats(e,t)}async generateStatsFile(){return(await this.inner).generate_stats_file()}async importStatsFile(e){return(await this.inner).import_stats_file(e)}async loadWeirpackFromBlob(e){let t=new Uint8Array(await e.arrayBuffer());return this.loadWeirpackFromBytes(t)}async loadWeirpackFromBytes(e){let t=await this.inner,n=e instanceof Uint8Array?e:Uint8Array.from(e);return t.import_weirpack(n)}async dispose(){this.disposed||(this.disposed=!0,(await this.inner).free())}};function l(e,t){if(!e)throw Error(t??`Assertion failed`)}var u=class{binary;constructor(e){this.binary=e,this.binary.setup()}async serializeArg(e){let{Lint:t,Span:n,Suggestion:r}=await this.binary.getBinaryModule();if(Array.isArray(e))return{json:JSON.stringify(await Promise.all(e.map(e=>this.serializeArg(e)))),type:`Array`};let i=typeof e;switch(i){case`string`:case`number`:case`boolean`:case`undefined`:return{json:JSON.stringify(e),type:i};case`bigint`:return{json:e.toString(),type:i}}if(e.to_json!==void 0){let i=e.to_json(),a,o=e.constructor?.name;if(e instanceof t||o===`Lint`?a=`Lint`:e instanceof r||o===`Suggestion`?a=`Suggestion`:(e instanceof n||o===`Span`)&&(a=`Span`),a===void 0)throw Error(`Unhandled case: type undefined`);return{json:i,type:a}}if(i==`object`)return{json:JSON.stringify(await Promise.all(Object.entries(e).map(([e,t])=>this.serializeArg([e,t])))),type:`object`};throw Error(`Unhandled case: ${e}`)}async serialize(e){return{procName:e.procName,args:await Promise.all(e.args.map(e=>this.serializeArg(e)))}}async deserializeArg(e){let{Lint:t,Span:n,Suggestion:r}=await this.binary.getBinaryModule();switch(e.type){case`bigint`:return BigInt(e.json);case`undefined`:return;case`boolean`:case`number`:case`string`:return JSON.parse(e.json);case`Suggestion`:return r.from_json(e.json);case`Lint`:return t.from_json(e.json);case`Span`:return n.from_json(e.json);case`Array`:{let t=JSON.parse(e.json);return l(Array.isArray(t)),await Promise.all(t.map(e=>this.deserializeArg(e)))}case`object`:{let t=JSON.parse(e.json);return Object.fromEntries(await Promise.all(t.map(e=>this.deserializeArg(e))))}default:throw Error(`Unhandled case: ${e.type}`)}}async deserialize(e){return{procName:e.procName,args:await Promise.all(e.args.map(e=>this.deserializeArg(e)))}}},d=`// \\0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
// ../../harper-wasm/pkg/harper_wasm_slim.js
var harper_wasm_slim_exports = /* @__PURE__ */ __exportAll({
	Dialect: () => Dialect$1,
	Language: () => Language$1,
	Lint: () => Lint$1,
	Linter: () => Linter$1,
	OrganizedGroup: () => OrganizedGroup$1,
	Span: () => Span$1,
	Suggestion: () => Suggestion$1,
	SuggestionKind: () => SuggestionKind$1,
	default: () => __wbg_init$1,
	get_default_lint_config: () => get_default_lint_config$1,
	get_default_lint_config_as_json: () => get_default_lint_config_as_json$1,
	initSync: () => initSync$1,
	setup: () => setup$1,
	to_title_case: () => to_title_case$1
});
/**
* Specifies an English Dialect, often used for linting.
* @enum {0 | 1 | 2 | 3 | 4}
*/
const Dialect$1 = Object.freeze({
	American: 0,
	"0": "American",
	British: 1,
	"1": "British",
	Australian: 2,
	"2": "Australian",
	Canadian: 3,
	"3": "Canadian",
	Indian: 4,
	"4": "Indian"
});
/**
* @enum {0 | 1 | 2}
*/
const Language$1 = Object.freeze({
	Plain: 0,
	"0": "Plain",
	Markdown: 1,
	"1": "Markdown",
	Typst: 2,
	"2": "Typst"
});
/**
* An error found in provided text.
*
* May include zero or more suggestions that may fix the problematic text.
*/
var Lint$1 = class Lint$1 {
	static __wrap(ptr) {
		const obj = Object.create(Lint$1.prototype);
		obj.__wbg_ptr = ptr;
		LintFinalization$1.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	static __unwrap(jsValue) {
		if (!(jsValue instanceof Lint$1)) return 0;
		return jsValue.__destroy_into_raw();
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		LintFinalization$1.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm$1.__wbg_lint_free(ptr, 0);
	}
	/**
	* @param {string} json
	* @returns {Lint}
	*/
	static from_json(json) {
		const ptr0 = passStringToWasm0$1(json, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.lint_from_json(ptr0, len0);
		if (ret[2]) throw takeFromExternrefTable0$1(ret[1]);
		return Lint$1.__wrap(ret[0]);
	}
	/**
	* Get the content of the source material pointed to by [\`Self::span\`]
	* @returns {string}
	*/
	get_problem_text() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.lint_get_problem_text(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a string representing the general category of the lint.
	* @returns {string}
	*/
	lint_kind() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.lint_lint_kind(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a string representing the general category of the lint.
	* @returns {string}
	*/
	lint_kind_pretty() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.lint_lint_kind_pretty(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a description of the error.
	* @returns {string}
	*/
	message() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.lint_message(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a description of the error as HTML.
	* @returns {string}
	*/
	message_html() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.lint_message_html(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get the location of the problematic text.
	* @returns {Span}
	*/
	span() {
		const ret = wasm$1.lint_span(this.__wbg_ptr);
		return Span$1.__wrap(ret);
	}
	/**
	* Equivalent to calling \`.length\` on the result of \`suggestions()\`.
	* @returns {number}
	*/
	suggestion_count() {
		return wasm$1.lint_suggestion_count(this.__wbg_ptr) >>> 0;
	}
	/**
	* Get an array of any suggestions that may resolve the issue.
	* @returns {Suggestion[]}
	*/
	suggestions() {
		const ret = wasm$1.lint_suggestions(this.__wbg_ptr);
		var v1 = getArrayJsValueFromWasm0$1(ret[0], ret[1]);
		wasm$1.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v1;
	}
	/**
	* @returns {string}
	*/
	to_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.lint_to_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
};
if (Symbol.dispose) Lint$1.prototype[Symbol.dispose] = Lint$1.prototype.free;
var Linter$1 = class Linter$1 {
	static __wrap(ptr) {
		const obj = Object.create(Linter$1.prototype);
		obj.__wbg_ptr = ptr;
		LinterFinalization$1.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		LinterFinalization$1.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm$1.__wbg_linter_free(ptr, 0);
	}
	/**
	* Apply a suggestion from a given lint.
	* This action will be logged to the Linter's statistics.
	* @param {string} source_text
	* @param {Lint} lint
	* @param {Suggestion} suggestion
	* @returns {string}
	*/
	apply_suggestion(source_text, lint, suggestion) {
		let deferred3_0;
		let deferred3_1;
		try {
			const ptr0 = passStringToWasm0$1(source_text, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
			const len0 = WASM_VECTOR_LEN$1;
			_assertClass$1(lint, Lint$1);
			_assertClass$1(suggestion, Suggestion$1);
			const ret = wasm$1.linter_apply_suggestion(this.__wbg_ptr, ptr0, len0, lint.__wbg_ptr, suggestion.__wbg_ptr);
			var ptr2 = ret[0];
			var len2 = ret[1];
			if (ret[3]) {
				ptr2 = 0;
				len2 = 0;
				throw takeFromExternrefTable0$1(ret[2]);
			}
			deferred3_0 = ptr2;
			deferred3_1 = len2;
			return getStringFromWasm0$1(ptr2, len2);
		} finally {
			wasm$1.__wbindgen_free(deferred3_0, deferred3_1, 1);
		}
	}
	clear_ignored_lints() {
		wasm$1.linter_clear_ignored_lints(this.__wbg_ptr);
	}
	/**
	* Clear the user dictionary.
	*/
	clear_words() {
		wasm$1.linter_clear_words(this.__wbg_ptr);
	}
	/**
	* Compute the context hash of a given lint.
	* @param {string} source_text
	* @param {Lint} lint
	* @returns {bigint}
	*/
	context_hash(source_text, lint) {
		const ptr0 = passStringToWasm0$1(source_text, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		_assertClass$1(lint, Lint$1);
		const ret = wasm$1.linter_context_hash(this.__wbg_ptr, ptr0, len0, lint.__wbg_ptr);
		return BigInt.asUintN(64, ret);
	}
	/**
	* Export the linter's ignored lints as a privacy-respecting JSON list of hashes.
	* @returns {string}
	*/
	export_ignored_lints() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.linter_export_ignored_lints(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Export words from the dictionary.
	* Note: this will only return words previously added by [\`Self::import_words\`].
	* @returns {string[]}
	*/
	export_words() {
		const ret = wasm$1.linter_export_words(this.__wbg_ptr);
		var v1 = getArrayJsValueFromWasm0$1(ret[0], ret[1]);
		wasm$1.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v1;
	}
	/**
	* @returns {string}
	*/
	generate_stats_file() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.linter_generate_stats_file(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get the dialect this struct was constructed for.
	* @returns {Dialect}
	*/
	get_dialect() {
		return wasm$1.linter_get_dialect(this.__wbg_ptr);
	}
	/**
	* @returns {string}
	*/
	get_lint_config_as_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.linter_get_lint_config_as_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* @returns {any}
	*/
	get_lint_config_as_object() {
		return wasm$1.linter_get_lint_config_as_object(this.__wbg_ptr);
	}
	/**
	* Get a JSON map containing the descriptions of all the linting rules, formatted as Markdown.
	* @returns {string}
	*/
	get_lint_descriptions_as_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.linter_get_lint_descriptions_as_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a Record containing the descriptions of all the linting rules, formatted as Markdown.
	* @returns {any}
	*/
	get_lint_descriptions_as_object() {
		return wasm$1.linter_get_lint_descriptions_as_object(this.__wbg_ptr);
	}
	/**
	* Get a JSON map containing the descriptions of all the linting rules, formatted as HTML.
	* @returns {string}
	*/
	get_lint_descriptions_html_as_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.linter_get_lint_descriptions_html_as_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a Record containing the descriptions of all the linting rules, formatted as HTML.
	* @returns {any}
	*/
	get_lint_descriptions_html_as_object() {
		return wasm$1.linter_get_lint_descriptions_html_as_object(this.__wbg_ptr);
	}
	/**
	* @returns {string}
	*/
	get_structured_lint_config_as_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.linter_get_structured_lint_config_as_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* @returns {any}
	*/
	get_structured_lint_config_as_object() {
		return wasm$1.linter_get_structured_lint_config_as_object(this.__wbg_ptr);
	}
	/**
	* Add a specific context hash to the ignored lints list.
	* @param {BigUint64Array} hashes
	*/
	ignore_hashes(hashes) {
		const ptr0 = passArray64ToWasm0$1(hashes, wasm$1.__wbindgen_malloc);
		const len0 = WASM_VECTOR_LEN$1;
		wasm$1.linter_ignore_hashes(this.__wbg_ptr, ptr0, len0);
	}
	/**
	* @param {string} source_text
	* @param {Lint[]} lints
	*/
	ignore_lints(source_text, lints) {
		const ptr0 = passStringToWasm0$1(source_text, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ptr1 = passArrayJsValueToWasm0$1(lints, wasm$1.__wbindgen_malloc);
		const len1 = WASM_VECTOR_LEN$1;
		wasm$1.linter_ignore_lints(this.__wbg_ptr, ptr0, len0, ptr1, len1);
	}
	/**
	* Import into the linter's ignored lints from a privacy-respecting JSON list of hashes.
	* @param {string} json
	*/
	import_ignored_lints(json) {
		const ptr0 = passStringToWasm0$1(json, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.linter_import_ignored_lints(this.__wbg_ptr, ptr0, len0);
		if (ret[1]) throw takeFromExternrefTable0$1(ret[0]);
	}
	/**
	* @param {string} file
	*/
	import_stats_file(file) {
		const ptr0 = passStringToWasm0$1(file, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.linter_import_stats_file(this.__wbg_ptr, ptr0, len0);
		if (ret[1]) throw takeFromExternrefTable0$1(ret[0]);
	}
	/**
	* Load a Weirpack from raw bytes, merging its rules into the current linter.
	* Returns test failures if any are found, and does not import in that case.
	* @param {Uint8Array} bytes
	* @returns {any}
	*/
	import_weirpack(bytes) {
		const ptr0 = passArray8ToWasm0$1(bytes, wasm$1.__wbindgen_malloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.linter_import_weirpack(this.__wbg_ptr, ptr0, len0);
		if (ret[2]) throw takeFromExternrefTable0$1(ret[1]);
		return takeFromExternrefTable0$1(ret[0]);
	}
	/**
	* Import words into the dictionary.
	* @param {string[]} additional_words
	*/
	import_words(additional_words) {
		const ptr0 = passArrayJsValueToWasm0$1(additional_words, wasm$1.__wbindgen_malloc);
		const len0 = WASM_VECTOR_LEN$1;
		wasm$1.linter_import_words(this.__wbg_ptr, ptr0, len0);
	}
	/**
	* Helper method to quickly check if a plain string is likely intended to be English
	* @param {string} text
	* @returns {boolean}
	*/
	is_likely_english(text) {
		const ptr0 = passStringToWasm0$1(text, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		return wasm$1.linter_is_likely_english(this.__wbg_ptr, ptr0, len0) !== 0;
	}
	/**
	* Helper method to remove non-English text from a plain English document.
	* @param {string} text
	* @returns {string}
	*/
	isolate_english(text) {
		let deferred2_0;
		let deferred2_1;
		try {
			const ptr0 = passStringToWasm0$1(text, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
			const len0 = WASM_VECTOR_LEN$1;
			const ret = wasm$1.linter_isolate_english(this.__wbg_ptr, ptr0, len0);
			deferred2_0 = ret[0];
			deferred2_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred2_0, deferred2_1, 1);
		}
	}
	/**
	* Perform the configured linting on the provided text.
	*
	* If the provided regex mask cannot be parsed, this method will return an empty array.
	* @param {string} text
	* @param {Language} language
	* @param {boolean} all_headings
	* @param {string | null | undefined} regex_mask
	* @param {boolean} dedup
	* @param {boolean} isolate_english
	* @returns {Lint[]}
	*/
	lint(text, language, all_headings, regex_mask, dedup, isolate_english) {
		const ptr0 = passStringToWasm0$1(text, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		var ptr1 = isLikeNone$1(regex_mask) ? 0 : passStringToWasm0$1(regex_mask, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		var len1 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.linter_lint(this.__wbg_ptr, ptr0, len0, language, all_headings, ptr1, len1, dedup, isolate_english);
		var v3 = getArrayJsValueFromWasm0$1(ret[0], ret[1]);
		wasm$1.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v3;
	}
	/**
	* Construct a new \`Linter\`.
	* Note that this can mean constructing the curated dictionary, which is the most expensive operation
	* in Harper.
	* @param {Dialect} dialect
	* @returns {Linter}
	*/
	static new(dialect) {
		const ret = wasm$1.linter_new(dialect);
		return Linter$1.__wrap(ret);
	}
	/**
	* @param {string} text
	* @param {Language} language
	* @param {boolean} all_headings
	* @param {string | null | undefined} regex_mask
	* @param {boolean} dedup
	* @param {boolean} isolate_english
	* @returns {OrganizedGroup[]}
	*/
	organized_lints(text, language, all_headings, regex_mask, dedup, isolate_english) {
		const ptr0 = passStringToWasm0$1(text, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		var ptr1 = isLikeNone$1(regex_mask) ? 0 : passStringToWasm0$1(regex_mask, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		var len1 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.linter_organized_lints(this.__wbg_ptr, ptr0, len0, language, all_headings, ptr1, len1, dedup, isolate_english);
		var v3 = getArrayJsValueFromWasm0$1(ret[0], ret[1]);
		wasm$1.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v3;
	}
	/**
	* @param {string} json
	*/
	set_lint_config_from_json(json) {
		const ptr0 = passStringToWasm0$1(json, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.linter_set_lint_config_from_json(this.__wbg_ptr, ptr0, len0);
		if (ret[1]) throw takeFromExternrefTable0$1(ret[0]);
	}
	/**
	* @param {any} object
	*/
	set_lint_config_from_object(object) {
		const ret = wasm$1.linter_set_lint_config_from_object(this.__wbg_ptr, object);
		if (ret[1]) throw takeFromExternrefTable0$1(ret[0]);
	}
	/**
	* @param {bigint | null} [start_time]
	* @param {bigint | null} [end_time]
	* @returns {any}
	*/
	summarize_stats(start_time, end_time) {
		return wasm$1.linter_summarize_stats(this.__wbg_ptr, !isLikeNone$1(start_time), isLikeNone$1(start_time) ? BigInt(0) : start_time, !isLikeNone$1(end_time), isLikeNone$1(end_time) ? BigInt(0) : end_time);
	}
};
if (Symbol.dispose) Linter$1.prototype[Symbol.dispose] = Linter$1.prototype.free;
/**
* Used exclusively for [\`Linter::organized_lints\`]
*/
var OrganizedGroup$1 = class OrganizedGroup$1 {
	static __wrap(ptr) {
		const obj = Object.create(OrganizedGroup$1.prototype);
		obj.__wbg_ptr = ptr;
		OrganizedGroupFinalization$1.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		OrganizedGroupFinalization$1.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm$1.__wbg_organizedgroup_free(ptr, 0);
	}
	/**
	* @returns {string}
	*/
	get group() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.__wbg_get_organizedgroup_group(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* @returns {Lint[]}
	*/
	get lints() {
		const ret = wasm$1.__wbg_get_organizedgroup_lints(this.__wbg_ptr);
		var v1 = getArrayJsValueFromWasm0$1(ret[0], ret[1]);
		wasm$1.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v1;
	}
	/**
	* @param {string} arg0
	*/
	set group(arg0) {
		const ptr0 = passStringToWasm0$1(arg0, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		wasm$1.__wbg_set_organizedgroup_group(this.__wbg_ptr, ptr0, len0);
	}
	/**
	* @param {Lint[]} arg0
	*/
	set lints(arg0) {
		const ptr0 = passArrayJsValueToWasm0$1(arg0, wasm$1.__wbindgen_malloc);
		const len0 = WASM_VECTOR_LEN$1;
		wasm$1.__wbg_set_organizedgroup_lints(this.__wbg_ptr, ptr0, len0);
	}
};
if (Symbol.dispose) OrganizedGroup$1.prototype[Symbol.dispose] = OrganizedGroup$1.prototype.free;
/**
* A struct that represents two character indices in a string: a start and an end.
*/
var Span$1 = class Span$1 {
	static __wrap(ptr) {
		const obj = Object.create(Span$1.prototype);
		obj.__wbg_ptr = ptr;
		SpanFinalization$1.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		SpanFinalization$1.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm$1.__wbg_span_free(ptr, 0);
	}
	/**
	* @returns {number}
	*/
	get end() {
		return wasm$1.__wbg_get_span_end(this.__wbg_ptr) >>> 0;
	}
	/**
	* @returns {number}
	*/
	get start() {
		return wasm$1.__wbg_get_span_start(this.__wbg_ptr) >>> 0;
	}
	/**
	* @param {number} arg0
	*/
	set end(arg0) {
		wasm$1.__wbg_set_span_end(this.__wbg_ptr, arg0);
	}
	/**
	* @param {number} arg0
	*/
	set start(arg0) {
		wasm$1.__wbg_set_span_start(this.__wbg_ptr, arg0);
	}
	/**
	* @param {string} json
	* @returns {Span}
	*/
	static from_json(json) {
		const ptr0 = passStringToWasm0$1(json, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.span_from_json(ptr0, len0);
		if (ret[2]) throw takeFromExternrefTable0$1(ret[1]);
		return Span$1.__wrap(ret[0]);
	}
	/**
	* @returns {boolean}
	*/
	is_empty() {
		return wasm$1.span_is_empty(this.__wbg_ptr) !== 0;
	}
	/**
	* @returns {number}
	*/
	len() {
		return wasm$1.span_len(this.__wbg_ptr) >>> 0;
	}
	/**
	* @param {number} start
	* @param {number} end
	* @returns {Span}
	*/
	static new(start, end) {
		const ret = wasm$1.span_new(start, end);
		return Span$1.__wrap(ret);
	}
	/**
	* @returns {string}
	*/
	to_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.span_to_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
};
if (Symbol.dispose) Span$1.prototype[Symbol.dispose] = Span$1.prototype.free;
/**
* A suggestion to fix a Lint.
*/
var Suggestion$1 = class Suggestion$1 {
	static __wrap(ptr) {
		const obj = Object.create(Suggestion$1.prototype);
		obj.__wbg_ptr = ptr;
		SuggestionFinalization$1.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		SuggestionFinalization$1.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm$1.__wbg_suggestion_free(ptr, 0);
	}
	/**
	* @param {string} json
	* @returns {Suggestion}
	*/
	static from_json(json) {
		const ptr0 = passStringToWasm0$1(json, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.suggestion_from_json(ptr0, len0);
		if (ret[2]) throw takeFromExternrefTable0$1(ret[1]);
		return Suggestion$1.__wrap(ret[0]);
	}
	/**
	* Get the text that is going to replace the problematic section.
	* If [\`Self::kind\`] is \`SuggestionKind::Remove\`, this will return an empty
	* string.
	* @returns {string}
	*/
	get_replacement_text() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.suggestion_get_replacement_text(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* @returns {SuggestionKind}
	*/
	kind() {
		return wasm$1.suggestion_kind(this.__wbg_ptr);
	}
	/**
	* @returns {string}
	*/
	to_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm$1.suggestion_to_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0$1(ret[0], ret[1]);
		} finally {
			wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
};
if (Symbol.dispose) Suggestion$1.prototype[Symbol.dispose] = Suggestion$1.prototype.free;
/**
* Tags the variant of suggestion.
* @enum {0 | 1 | 2}
*/
const SuggestionKind$1 = Object.freeze({
	/**
	* Replace the problematic text.
	*/
	Replace: 0,
	"0": "Replace",
	/**
	* Remove the problematic text.
	*/
	Remove: 1,
	"1": "Remove",
	/**
	* Insert additional text after the error.
	*/
	InsertAfter: 2,
	"2": "InsertAfter"
});
/**
* @returns {any}
*/
function get_default_lint_config$1() {
	return wasm$1.get_default_lint_config();
}
/**
* @returns {string}
*/
function get_default_lint_config_as_json$1() {
	let deferred1_0;
	let deferred1_1;
	try {
		const ret = wasm$1.get_default_lint_config_as_json();
		deferred1_0 = ret[0];
		deferred1_1 = ret[1];
		return getStringFromWasm0$1(ret[0], ret[1]);
	} finally {
		wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
	}
}
/**
* Set up the WebAssembly module's logging.
*/
function setup$1() {
	wasm$1.setup();
}
/**
* @param {string} text
* @returns {string}
*/
function to_title_case$1(text) {
	let deferred2_0;
	let deferred2_1;
	try {
		const ptr0 = passStringToWasm0$1(text, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN$1;
		const ret = wasm$1.to_title_case(ptr0, len0);
		deferred2_0 = ret[0];
		deferred2_1 = ret[1];
		return getStringFromWasm0$1(ret[0], ret[1]);
	} finally {
		wasm$1.__wbindgen_free(deferred2_0, deferred2_1, 1);
	}
}
function __wbg_get_imports$1() {
	return {
		__proto__: null,
		"./harper_wasm_slim_bg.js": {
			__proto__: null,
			__wbg_Error_30c8987f7c2ed4e2: function(arg0, arg1) {
				return Error(getStringFromWasm0$1(arg0, arg1));
			},
			__wbg_String_8564e559799eccda: function(arg0, arg1) {
				const ptr1 = passStringToWasm0$1(String(arg1), wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
				const len1 = WASM_VECTOR_LEN$1;
				getDataViewMemory0$1().setInt32(arg0 + 4, len1, true);
				getDataViewMemory0$1().setInt32(arg0 + 0, ptr1, true);
			},
			__wbg___wbindgen_boolean_get_5b446f51afd21013: function(arg0) {
				const v = arg0;
				const ret = typeof v === "boolean" ? v : void 0;
				return isLikeNone$1(ret) ? 16777215 : ret ? 1 : 0;
			},
			__wbg___wbindgen_debug_string_4687d8d8c2017d52: function(arg0, arg1) {
				const ptr1 = passStringToWasm0$1(debugString$1(arg1), wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
				const len1 = WASM_VECTOR_LEN$1;
				getDataViewMemory0$1().setInt32(arg0 + 4, len1, true);
				getDataViewMemory0$1().setInt32(arg0 + 0, ptr1, true);
			},
			__wbg___wbindgen_is_function_1f9d30630b8b1d3d: function(arg0) {
				return typeof arg0 === "function";
			},
			__wbg___wbindgen_is_object_3c45d4f2dde4e749: function(arg0) {
				const val = arg0;
				return typeof val === "object" && val !== null;
			},
			__wbg___wbindgen_is_string_90b56bc79aad6f6c: function(arg0) {
				return typeof arg0 === "string";
			},
			__wbg___wbindgen_jsval_loose_eq_677f21e468d6b461: function(arg0, arg1) {
				return arg0 == arg1;
			},
			__wbg___wbindgen_number_get_2e0e7dee9f701a71: function(arg0, arg1) {
				const obj = arg1;
				const ret = typeof obj === "number" ? obj : void 0;
				getDataViewMemory0$1().setFloat64(arg0 + 8, isLikeNone$1(ret) ? 0 : ret, true);
				getDataViewMemory0$1().setInt32(arg0 + 0, !isLikeNone$1(ret), true);
			},
			__wbg___wbindgen_string_get_0380ccaa2f57f0d9: function(arg0, arg1) {
				const obj = arg1;
				const ret = typeof obj === "string" ? obj : void 0;
				var ptr1 = isLikeNone$1(ret) ? 0 : passStringToWasm0$1(ret, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
				var len1 = WASM_VECTOR_LEN$1;
				getDataViewMemory0$1().setInt32(arg0 + 4, len1, true);
				getDataViewMemory0$1().setInt32(arg0 + 0, ptr1, true);
			},
			__wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
				throw new Error(getStringFromWasm0$1(arg0, arg1));
			},
			__wbg_call_6137034ef55c9d0f: function() {
				return handleError$1(function(arg0, arg1) {
					return arg0.call(arg1);
				}, arguments);
			},
			__wbg_done_b41a1d26cdb37fb6: function(arg0) {
				return arg0.done;
			},
			__wbg_entries_fb6397112b1de25f: function(arg0) {
				return Object.entries(arg0);
			},
			__wbg_error_757e9472f8410341: function(arg0, arg1) {
				let deferred0_0;
				let deferred0_1;
				try {
					deferred0_0 = arg0;
					deferred0_1 = arg1;
					console.error(getStringFromWasm0$1(arg0, arg1));
				} finally {
					wasm$1.__wbindgen_free(deferred0_0, deferred0_1, 1);
				}
			},
			__wbg_getRandomValues_973dabfb0ad1769f: function() {
				return handleError$1(function(arg0, arg1) {
					globalThis.crypto.getRandomValues(getArrayU8FromWasm0$1(arg0, arg1));
				}, arguments);
			},
			__wbg_getRandomValues_a608c4436c19407a: function() {
				return handleError$1(function(arg0, arg1) {
					globalThis.crypto.getRandomValues(getArrayU8FromWasm0$1(arg0, arg1));
				}, arguments);
			},
			__wbg_getTime_f5a55efff2585d5d: function(arg0) {
				return arg0.getTime();
			},
			__wbg_get_658f6698067d9515: function() {
				return handleError$1(function(arg0, arg1) {
					return Reflect.get(arg0, arg1);
				}, arguments);
			},
			__wbg_get_6c896e0571ddae51: function(arg0, arg1) {
				return arg0[arg1 >>> 0];
			},
			__wbg_get_unchecked_288889d017702237: function(arg0, arg1) {
				return arg0[arg1 >>> 0];
			},
			__wbg_instanceof_ArrayBuffer_a99f175873e5d9b8: function(arg0) {
				let result;
				try {
					result = arg0 instanceof ArrayBuffer;
				} catch (_) {
					result = false;
				}
				return result;
			},
			__wbg_instanceof_Uint8Array_828cef2aaacafc31: function(arg0) {
				let result;
				try {
					result = arg0 instanceof Uint8Array;
				} catch (_) {
					result = false;
				}
				return result;
			},
			__wbg_iterator_e3c31c892080e444: function() {
				return Symbol.iterator;
			},
			__wbg_length_7f3c00c40364105e: function(arg0) {
				return arg0.length;
			},
			__wbg_length_d4bdea10311bd9cf: function(arg0) {
				return arg0.length;
			},
			__wbg_lint_new: function(arg0) {
				return Lint$1.__wrap(arg0);
			},
			__wbg_lint_unwrap: function(arg0) {
				return Lint$1.__unwrap(arg0);
			},
			__wbg_log_1f8cbb01c83d06c2: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
				let deferred0_0;
				let deferred0_1;
				try {
					deferred0_0 = arg0;
					deferred0_1 = arg1;
					console.log(getStringFromWasm0$1(arg0, arg1), getStringFromWasm0$1(arg2, arg3), getStringFromWasm0$1(arg4, arg5), getStringFromWasm0$1(arg6, arg7));
				} finally {
					wasm$1.__wbindgen_free(deferred0_0, deferred0_1, 1);
				}
			},
			__wbg_log_a54ca6b45e09078a: function(arg0, arg1) {
				let deferred0_0;
				let deferred0_1;
				try {
					deferred0_0 = arg0;
					deferred0_1 = arg1;
					console.log(getStringFromWasm0$1(arg0, arg1));
				} finally {
					wasm$1.__wbindgen_free(deferred0_0, deferred0_1, 1);
				}
			},
			__wbg_mark_6b7f03786f5e4d61: function(arg0, arg1) {
				performance.mark(getStringFromWasm0$1(arg0, arg1));
			},
			__wbg_measure_0e21b33a1c6e3a29: function() {
				return handleError$1(function(arg0, arg1, arg2, arg3) {
					let deferred0_0;
					let deferred0_1;
					let deferred1_0;
					let deferred1_1;
					try {
						deferred0_0 = arg0;
						deferred0_1 = arg1;
						deferred1_0 = arg2;
						deferred1_1 = arg3;
						performance.measure(getStringFromWasm0$1(arg0, arg1), getStringFromWasm0$1(arg2, arg3));
					} finally {
						wasm$1.__wbindgen_free(deferred0_0, deferred0_1, 1);
						wasm$1.__wbindgen_free(deferred1_0, deferred1_1, 1);
					}
				}, arguments);
			},
			__wbg_new_0_72d020f0c63443d4: function() {
				return /* @__PURE__ */ new Date();
			},
			__wbg_new_1dbf7428bba60a42: function(arg0) {
				return new Uint8Array(arg0);
			},
			__wbg_new_227d7c05414eb861: function() {
				return /* @__PURE__ */ new Error();
			},
			__wbg_new_28744009d011f847: function() {
				return /* @__PURE__ */ new Map();
			},
			__wbg_new_617a8cdb8bb1130e: function() {
				return /* @__PURE__ */ new Object();
			},
			__wbg_new_ee2291f50781bf1d: function() {
				return new Array();
			},
			__wbg_next_33784799010f1bbe: function(arg0) {
				return arg0.next;
			},
			__wbg_next_f4aac29c42af995c: function() {
				return handleError$1(function(arg0) {
					return arg0.next();
				}, arguments);
			},
			__wbg_organizedgroup_new: function(arg0) {
				return OrganizedGroup$1.__wrap(arg0);
			},
			__wbg_prototypesetcall_bc27214492979395: function(arg0, arg1, arg2) {
				Uint8Array.prototype.set.call(getArrayU8FromWasm0$1(arg0, arg1), arg2);
			},
			__wbg_set_6ae97e73113c4f0b: function(arg0, arg1, arg2) {
				return arg0.set(arg1, arg2);
			},
			__wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
				arg0[arg1] = arg2;
			},
			__wbg_set_bea140a88be9b277: function(arg0, arg1, arg2) {
				arg0[arg1 >>> 0] = arg2;
			},
			__wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
				const ret = arg1.stack;
				const ptr1 = passStringToWasm0$1(ret, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
				const len1 = WASM_VECTOR_LEN$1;
				getDataViewMemory0$1().setInt32(arg0 + 4, len1, true);
				getDataViewMemory0$1().setInt32(arg0 + 0, ptr1, true);
			},
			__wbg_suggestion_new: function(arg0) {
				return Suggestion$1.__wrap(arg0);
			},
			__wbg_value_f3c585ee8f5ba40c: function(arg0) {
				return arg0.value;
			},
			__wbindgen_generic_0000000000000001: function(arg0) {
				return arg0;
			},
			__wbindgen_generic_0000000000000002: function(arg0, arg1) {
				return getStringFromWasm0$1(arg0, arg1);
			},
			__wbindgen_init_externref_table: function() {
				const table = wasm$1.__wbindgen_externrefs;
				const offset = table.grow(4);
				table.set(0, void 0);
				table.set(offset + 0, void 0);
				table.set(offset + 1, null);
				table.set(offset + 2, true);
				table.set(offset + 3, false);
			}
		}
	};
}
const LintFinalization$1 = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm$1.__wbg_lint_free(ptr, 1));
const LinterFinalization$1 = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm$1.__wbg_linter_free(ptr, 1));
const OrganizedGroupFinalization$1 = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm$1.__wbg_organizedgroup_free(ptr, 1));
const SpanFinalization$1 = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm$1.__wbg_span_free(ptr, 1));
const SuggestionFinalization$1 = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm$1.__wbg_suggestion_free(ptr, 1));
function addToExternrefTable0$1(obj) {
	const idx = wasm$1.__externref_table_alloc();
	wasm$1.__wbindgen_externrefs.set(idx, obj);
	return idx;
}
function _assertClass$1(instance, klass) {
	if (!(instance instanceof klass)) throw new Error(\`expected instance of \${klass.name}\`);
}
function debugString$1(val) {
	const type = typeof val;
	if (type == "number" || type == "boolean" || val == null) return \`\${val}\`;
	if (type == "string") return \`"\${val}"\`;
	if (type == "symbol") {
		const description = val.description;
		if (description == null) return "Symbol";
		else return \`Symbol(\${description})\`;
	}
	if (type == "function") {
		const name = val.name;
		if (typeof name == "string" && name.length > 0) return \`Function(\${name})\`;
		else return "Function";
	}
	if (Array.isArray(val)) {
		const length = val.length;
		let debug = "[";
		if (length > 0) debug += debugString$1(val[0]);
		for (let i = 1; i < length; i++) debug += ", " + debugString$1(val[i]);
		debug += "]";
		return debug;
	}
	const builtInMatches = /\\[object ([^\\]]+)\\]/.exec(toString.call(val));
	let className;
	if (builtInMatches && builtInMatches.length > 1) className = builtInMatches[1];
	else return toString.call(val);
	if (className == "Object") try {
		return "Object(" + JSON.stringify(val) + ")";
	} catch (_) {
		return "Object";
	}
	if (val instanceof Error) return \`\${val.name}: \${val.message}\\n\${val.stack}\`;
	return className;
}
function getArrayJsValueFromWasm0$1(ptr, len) {
	ptr = ptr >>> 0;
	const mem = getDataViewMemory0$1();
	const result = [];
	for (let i = ptr; i < ptr + 4 * len; i += 4) result.push(wasm$1.__wbindgen_externrefs.get(mem.getUint32(i, true)));
	wasm$1.__externref_drop_slice(ptr, len);
	return result;
}
function getArrayU8FromWasm0$1(ptr, len) {
	ptr = ptr >>> 0;
	return getUint8ArrayMemory0$1().subarray(ptr / 1, ptr / 1 + len);
}
let cachedBigUint64ArrayMemory0$1 = null;
function getBigUint64ArrayMemory0$1() {
	if (cachedBigUint64ArrayMemory0$1 === null || cachedBigUint64ArrayMemory0$1.byteLength === 0) cachedBigUint64ArrayMemory0$1 = new BigUint64Array(wasm$1.memory.buffer);
	return cachedBigUint64ArrayMemory0$1;
}
let cachedDataViewMemory0$1 = null;
function getDataViewMemory0$1() {
	if (cachedDataViewMemory0$1 === null || cachedDataViewMemory0$1.buffer.detached === true || cachedDataViewMemory0$1.buffer.detached === void 0 && cachedDataViewMemory0$1.buffer !== wasm$1.memory.buffer) cachedDataViewMemory0$1 = new DataView(wasm$1.memory.buffer);
	return cachedDataViewMemory0$1;
}
function getStringFromWasm0$1(ptr, len) {
	return decodeText$1(ptr >>> 0, len);
}
let cachedUint8ArrayMemory0$1 = null;
function getUint8ArrayMemory0$1() {
	if (cachedUint8ArrayMemory0$1 === null || cachedUint8ArrayMemory0$1.byteLength === 0) cachedUint8ArrayMemory0$1 = new Uint8Array(wasm$1.memory.buffer);
	return cachedUint8ArrayMemory0$1;
}
function handleError$1(f, args) {
	try {
		return f.apply(this, args);
	} catch (e) {
		const idx = addToExternrefTable0$1(e);
		wasm$1.__wbindgen_exn_store(idx);
	}
}
function isLikeNone$1(x) {
	return x === void 0 || x === null;
}
function passArray64ToWasm0$1(arg, malloc) {
	const ptr = malloc(arg.length * 8, 8) >>> 0;
	getBigUint64ArrayMemory0$1().set(arg, ptr / 8);
	WASM_VECTOR_LEN$1 = arg.length;
	return ptr;
}
function passArray8ToWasm0$1(arg, malloc) {
	const ptr = malloc(arg.length * 1, 1) >>> 0;
	getUint8ArrayMemory0$1().set(arg, ptr / 1);
	WASM_VECTOR_LEN$1 = arg.length;
	return ptr;
}
function passArrayJsValueToWasm0$1(array, malloc) {
	const ptr = malloc(array.length * 4, 4) >>> 0;
	for (let i = 0; i < array.length; i++) {
		const add = addToExternrefTable0$1(array[i]);
		getDataViewMemory0$1().setUint32(ptr + 4 * i, add, true);
	}
	WASM_VECTOR_LEN$1 = array.length;
	return ptr;
}
function passStringToWasm0$1(arg, malloc, realloc) {
	if (realloc === void 0) {
		const buf = cachedTextEncoder$1.encode(arg);
		const ptr = malloc(buf.length, 1) >>> 0;
		getUint8ArrayMemory0$1().subarray(ptr, ptr + buf.length).set(buf);
		WASM_VECTOR_LEN$1 = buf.length;
		return ptr;
	}
	let len = arg.length;
	let ptr = malloc(len, 1) >>> 0;
	const mem = getUint8ArrayMemory0$1();
	let offset = 0;
	for (; offset < len; offset++) {
		const code = arg.charCodeAt(offset);
		if (code > 127) break;
		mem[ptr + offset] = code;
	}
	if (offset !== len) {
		if (offset !== 0) arg = arg.slice(offset);
		ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
		const view = getUint8ArrayMemory0$1().subarray(ptr + offset, ptr + len);
		const ret = cachedTextEncoder$1.encodeInto(arg, view);
		offset += ret.written;
		ptr = realloc(ptr, len, offset, 1) >>> 0;
	}
	WASM_VECTOR_LEN$1 = offset;
	return ptr;
}
function takeFromExternrefTable0$1(idx) {
	const value = wasm$1.__wbindgen_externrefs.get(idx);
	wasm$1.__externref_table_dealloc(idx);
	return value;
}
let cachedTextDecoder$1 = new TextDecoder("utf-8", {
	ignoreBOM: true,
	fatal: true
});
cachedTextDecoder$1.decode();
const MAX_SAFARI_DECODE_BYTES$1 = 2146435072;
let numBytesDecoded$1 = 0;
function decodeText$1(ptr, len) {
	numBytesDecoded$1 += len;
	if (numBytesDecoded$1 >= MAX_SAFARI_DECODE_BYTES$1) {
		cachedTextDecoder$1 = new TextDecoder("utf-8", {
			ignoreBOM: true,
			fatal: true
		});
		cachedTextDecoder$1.decode();
		numBytesDecoded$1 = len;
	}
	return cachedTextDecoder$1.decode(getUint8ArrayMemory0$1().subarray(ptr, ptr + len));
}
const cachedTextEncoder$1 = new TextEncoder();
if (!("encodeInto" in cachedTextEncoder$1)) cachedTextEncoder$1.encodeInto = function(arg, view) {
	const buf = cachedTextEncoder$1.encode(arg);
	view.set(buf);
	return {
		read: arg.length,
		written: buf.length
	};
};
let WASM_VECTOR_LEN$1 = 0;
let wasm$1;
function __wbg_finalize_init$1(instance, module) {
	wasm$1 = instance.exports;
	cachedBigUint64ArrayMemory0$1 = null;
	cachedDataViewMemory0$1 = null;
	cachedUint8ArrayMemory0$1 = null;
	wasm$1.__wbindgen_start();
	return wasm$1;
}
async function __wbg_load$1(module, imports) {
	if (typeof Response === "function" && module instanceof Response) {
		if (!module.ok) throw new Error(\`failed to fetch Wasm: \${module.status} \${module.statusText} fetching '\${module.url}'\`);
		if (typeof WebAssembly.instantiateStreaming === "function") try {
			return await WebAssembly.instantiateStreaming(module, imports);
		} catch (e) {
			if (expectedResponseType(module.type) && module.headers.get("Content-Type") !== "application/wasm") console.warn("\`WebAssembly.instantiateStreaming\` failed because your server does not serve Wasm with \`application/wasm\` MIME type. Falling back to \`WebAssembly.instantiate\` which is slower. Original error:\\n", e);
			else throw e;
		}
		const bytes = await module.arrayBuffer();
		return await WebAssembly.instantiate(bytes, imports);
	} else {
		const instance = await WebAssembly.instantiate(module, imports);
		if (instance instanceof WebAssembly.Instance) return {
			instance,
			module
		};
		else return instance;
	}
	function expectedResponseType(type) {
		switch (type) {
			case "basic":
			case "cors":
			case "default": return true;
		}
		return false;
	}
}
function initSync$1(module) {
	if (wasm$1 !== void 0) return wasm$1;
	if (module !== void 0) {
		if (Object.getPrototypeOf(module) === Object.prototype) ({module} = module);
		else console.warn("using deprecated parameters for \`initSync()\`; pass a single object instead");
	}
	const imports = __wbg_get_imports$1();
	if (!(module instanceof WebAssembly.Module)) module = new WebAssembly.Module(module);
	return __wbg_finalize_init$1(new WebAssembly.Instance(module, imports), module);
}
async function __wbg_init$1(module_or_path) {
	if (wasm$1 !== void 0) return wasm$1;
	if (module_or_path !== void 0) {
		if (Object.getPrototypeOf(module_or_path) === Object.prototype) ({module_or_path} = module_or_path);
		else console.warn("using deprecated parameters for the initialization function; pass a single object instead");
	}
	if (module_or_path === void 0) module_or_path = new URL();
	const imports = __wbg_get_imports$1();
	if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) module_or_path = fetch(module_or_path);
	const { instance, module } = await __wbg_load$1(await module_or_path, imports);
	return __wbg_finalize_init$1(instance, module);
}
// ../../harper-wasm/pkg/harper_wasm.js
var harper_wasm_exports = /* @__PURE__ */ __exportAll({
	Dialect: () => Dialect,
	Language: () => Language,
	Lint: () => Lint,
	Linter: () => Linter,
	OrganizedGroup: () => OrganizedGroup,
	Span: () => Span,
	Suggestion: () => Suggestion,
	SuggestionKind: () => SuggestionKind,
	default: () => __wbg_init,
	get_default_lint_config: () => get_default_lint_config,
	get_default_lint_config_as_json: () => get_default_lint_config_as_json,
	initSync: () => initSync,
	setup: () => setup,
	to_title_case: () => to_title_case
});
/**
* Specifies an English Dialect, often used for linting.
* @enum {0 | 1 | 2 | 3 | 4}
*/
const Dialect = Object.freeze({
	American: 0,
	"0": "American",
	British: 1,
	"1": "British",
	Australian: 2,
	"2": "Australian",
	Canadian: 3,
	"3": "Canadian",
	Indian: 4,
	"4": "Indian"
});
/**
* @enum {0 | 1 | 2}
*/
const Language = Object.freeze({
	Plain: 0,
	"0": "Plain",
	Markdown: 1,
	"1": "Markdown",
	Typst: 2,
	"2": "Typst"
});
/**
* An error found in provided text.
*
* May include zero or more suggestions that may fix the problematic text.
*/
var Lint = class Lint {
	static __wrap(ptr) {
		const obj = Object.create(Lint.prototype);
		obj.__wbg_ptr = ptr;
		LintFinalization.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	static __unwrap(jsValue) {
		if (!(jsValue instanceof Lint)) return 0;
		return jsValue.__destroy_into_raw();
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		LintFinalization.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm.__wbg_lint_free(ptr, 0);
	}
	/**
	* @param {string} json
	* @returns {Lint}
	*/
	static from_json(json) {
		const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.lint_from_json(ptr0, len0);
		if (ret[2]) throw takeFromExternrefTable0(ret[1]);
		return Lint.__wrap(ret[0]);
	}
	/**
	* Get the content of the source material pointed to by [\`Self::span\`]
	* @returns {string}
	*/
	get_problem_text() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.lint_get_problem_text(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a string representing the general category of the lint.
	* @returns {string}
	*/
	lint_kind() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.lint_lint_kind(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a string representing the general category of the lint.
	* @returns {string}
	*/
	lint_kind_pretty() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.lint_lint_kind_pretty(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a description of the error.
	* @returns {string}
	*/
	message() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.lint_message(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a description of the error as HTML.
	* @returns {string}
	*/
	message_html() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.lint_message_html(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get the location of the problematic text.
	* @returns {Span}
	*/
	span() {
		const ret = wasm.lint_span(this.__wbg_ptr);
		return Span.__wrap(ret);
	}
	/**
	* Equivalent to calling \`.length\` on the result of \`suggestions()\`.
	* @returns {number}
	*/
	suggestion_count() {
		return wasm.lint_suggestion_count(this.__wbg_ptr) >>> 0;
	}
	/**
	* Get an array of any suggestions that may resolve the issue.
	* @returns {Suggestion[]}
	*/
	suggestions() {
		const ret = wasm.lint_suggestions(this.__wbg_ptr);
		var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
		wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v1;
	}
	/**
	* @returns {string}
	*/
	to_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.lint_to_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
};
if (Symbol.dispose) Lint.prototype[Symbol.dispose] = Lint.prototype.free;
var Linter = class Linter {
	static __wrap(ptr) {
		const obj = Object.create(Linter.prototype);
		obj.__wbg_ptr = ptr;
		LinterFinalization.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		LinterFinalization.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm.__wbg_linter_free(ptr, 0);
	}
	/**
	* Apply a suggestion from a given lint.
	* This action will be logged to the Linter's statistics.
	* @param {string} source_text
	* @param {Lint} lint
	* @param {Suggestion} suggestion
	* @returns {string}
	*/
	apply_suggestion(source_text, lint, suggestion) {
		let deferred3_0;
		let deferred3_1;
		try {
			const ptr0 = passStringToWasm0(source_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
			const len0 = WASM_VECTOR_LEN;
			_assertClass(lint, Lint);
			_assertClass(suggestion, Suggestion);
			const ret = wasm.linter_apply_suggestion(this.__wbg_ptr, ptr0, len0, lint.__wbg_ptr, suggestion.__wbg_ptr);
			var ptr2 = ret[0];
			var len2 = ret[1];
			if (ret[3]) {
				ptr2 = 0;
				len2 = 0;
				throw takeFromExternrefTable0(ret[2]);
			}
			deferred3_0 = ptr2;
			deferred3_1 = len2;
			return getStringFromWasm0(ptr2, len2);
		} finally {
			wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
		}
	}
	clear_ignored_lints() {
		wasm.linter_clear_ignored_lints(this.__wbg_ptr);
	}
	/**
	* Clear the user dictionary.
	*/
	clear_words() {
		wasm.linter_clear_words(this.__wbg_ptr);
	}
	/**
	* Compute the context hash of a given lint.
	* @param {string} source_text
	* @param {Lint} lint
	* @returns {bigint}
	*/
	context_hash(source_text, lint) {
		const ptr0 = passStringToWasm0(source_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		_assertClass(lint, Lint);
		const ret = wasm.linter_context_hash(this.__wbg_ptr, ptr0, len0, lint.__wbg_ptr);
		return BigInt.asUintN(64, ret);
	}
	/**
	* Export the linter's ignored lints as a privacy-respecting JSON list of hashes.
	* @returns {string}
	*/
	export_ignored_lints() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.linter_export_ignored_lints(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Export words from the dictionary.
	* Note: this will only return words previously added by [\`Self::import_words\`].
	* @returns {string[]}
	*/
	export_words() {
		const ret = wasm.linter_export_words(this.__wbg_ptr);
		var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
		wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v1;
	}
	/**
	* @returns {string}
	*/
	generate_stats_file() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.linter_generate_stats_file(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get the dialect this struct was constructed for.
	* @returns {Dialect}
	*/
	get_dialect() {
		return wasm.linter_get_dialect(this.__wbg_ptr);
	}
	/**
	* @returns {string}
	*/
	get_lint_config_as_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.linter_get_lint_config_as_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* @returns {any}
	*/
	get_lint_config_as_object() {
		return wasm.linter_get_lint_config_as_object(this.__wbg_ptr);
	}
	/**
	* Get a JSON map containing the descriptions of all the linting rules, formatted as Markdown.
	* @returns {string}
	*/
	get_lint_descriptions_as_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.linter_get_lint_descriptions_as_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a Record containing the descriptions of all the linting rules, formatted as Markdown.
	* @returns {any}
	*/
	get_lint_descriptions_as_object() {
		return wasm.linter_get_lint_descriptions_as_object(this.__wbg_ptr);
	}
	/**
	* Get a JSON map containing the descriptions of all the linting rules, formatted as HTML.
	* @returns {string}
	*/
	get_lint_descriptions_html_as_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.linter_get_lint_descriptions_html_as_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* Get a Record containing the descriptions of all the linting rules, formatted as HTML.
	* @returns {any}
	*/
	get_lint_descriptions_html_as_object() {
		return wasm.linter_get_lint_descriptions_html_as_object(this.__wbg_ptr);
	}
	/**
	* @returns {string}
	*/
	get_structured_lint_config_as_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.linter_get_structured_lint_config_as_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* @returns {any}
	*/
	get_structured_lint_config_as_object() {
		return wasm.linter_get_structured_lint_config_as_object(this.__wbg_ptr);
	}
	/**
	* Add a specific context hash to the ignored lints list.
	* @param {BigUint64Array} hashes
	*/
	ignore_hashes(hashes) {
		const ptr0 = passArray64ToWasm0(hashes, wasm.__wbindgen_malloc);
		const len0 = WASM_VECTOR_LEN;
		wasm.linter_ignore_hashes(this.__wbg_ptr, ptr0, len0);
	}
	/**
	* @param {string} source_text
	* @param {Lint[]} lints
	*/
	ignore_lints(source_text, lints) {
		const ptr0 = passStringToWasm0(source_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ptr1 = passArrayJsValueToWasm0(lints, wasm.__wbindgen_malloc);
		const len1 = WASM_VECTOR_LEN;
		wasm.linter_ignore_lints(this.__wbg_ptr, ptr0, len0, ptr1, len1);
	}
	/**
	* Import into the linter's ignored lints from a privacy-respecting JSON list of hashes.
	* @param {string} json
	*/
	import_ignored_lints(json) {
		const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.linter_import_ignored_lints(this.__wbg_ptr, ptr0, len0);
		if (ret[1]) throw takeFromExternrefTable0(ret[0]);
	}
	/**
	* @param {string} file
	*/
	import_stats_file(file) {
		const ptr0 = passStringToWasm0(file, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.linter_import_stats_file(this.__wbg_ptr, ptr0, len0);
		if (ret[1]) throw takeFromExternrefTable0(ret[0]);
	}
	/**
	* Load a Weirpack from raw bytes, merging its rules into the current linter.
	* Returns test failures if any are found, and does not import in that case.
	* @param {Uint8Array} bytes
	* @returns {any}
	*/
	import_weirpack(bytes) {
		const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.linter_import_weirpack(this.__wbg_ptr, ptr0, len0);
		if (ret[2]) throw takeFromExternrefTable0(ret[1]);
		return takeFromExternrefTable0(ret[0]);
	}
	/**
	* Import words into the dictionary.
	* @param {string[]} additional_words
	*/
	import_words(additional_words) {
		const ptr0 = passArrayJsValueToWasm0(additional_words, wasm.__wbindgen_malloc);
		const len0 = WASM_VECTOR_LEN;
		wasm.linter_import_words(this.__wbg_ptr, ptr0, len0);
	}
	/**
	* Helper method to quickly check if a plain string is likely intended to be English
	* @param {string} text
	* @returns {boolean}
	*/
	is_likely_english(text) {
		const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		return wasm.linter_is_likely_english(this.__wbg_ptr, ptr0, len0) !== 0;
	}
	/**
	* Helper method to remove non-English text from a plain English document.
	* @param {string} text
	* @returns {string}
	*/
	isolate_english(text) {
		let deferred2_0;
		let deferred2_1;
		try {
			const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
			const len0 = WASM_VECTOR_LEN;
			const ret = wasm.linter_isolate_english(this.__wbg_ptr, ptr0, len0);
			deferred2_0 = ret[0];
			deferred2_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
		}
	}
	/**
	* Perform the configured linting on the provided text.
	*
	* If the provided regex mask cannot be parsed, this method will return an empty array.
	* @param {string} text
	* @param {Language} language
	* @param {boolean} all_headings
	* @param {string | null | undefined} regex_mask
	* @param {boolean} dedup
	* @param {boolean} isolate_english
	* @returns {Lint[]}
	*/
	lint(text, language, all_headings, regex_mask, dedup, isolate_english) {
		const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		var ptr1 = isLikeNone(regex_mask) ? 0 : passStringToWasm0(regex_mask, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		var len1 = WASM_VECTOR_LEN;
		const ret = wasm.linter_lint(this.__wbg_ptr, ptr0, len0, language, all_headings, ptr1, len1, dedup, isolate_english);
		var v3 = getArrayJsValueFromWasm0(ret[0], ret[1]);
		wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v3;
	}
	/**
	* Construct a new \`Linter\`.
	* Note that this can mean constructing the curated dictionary, which is the most expensive operation
	* in Harper.
	* @param {Dialect} dialect
	* @returns {Linter}
	*/
	static new(dialect) {
		const ret = wasm.linter_new(dialect);
		return Linter.__wrap(ret);
	}
	/**
	* @param {string} text
	* @param {Language} language
	* @param {boolean} all_headings
	* @param {string | null | undefined} regex_mask
	* @param {boolean} dedup
	* @param {boolean} isolate_english
	* @returns {OrganizedGroup[]}
	*/
	organized_lints(text, language, all_headings, regex_mask, dedup, isolate_english) {
		const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		var ptr1 = isLikeNone(regex_mask) ? 0 : passStringToWasm0(regex_mask, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		var len1 = WASM_VECTOR_LEN;
		const ret = wasm.linter_organized_lints(this.__wbg_ptr, ptr0, len0, language, all_headings, ptr1, len1, dedup, isolate_english);
		var v3 = getArrayJsValueFromWasm0(ret[0], ret[1]);
		wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v3;
	}
	/**
	* @param {string} json
	*/
	set_lint_config_from_json(json) {
		const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.linter_set_lint_config_from_json(this.__wbg_ptr, ptr0, len0);
		if (ret[1]) throw takeFromExternrefTable0(ret[0]);
	}
	/**
	* @param {any} object
	*/
	set_lint_config_from_object(object) {
		const ret = wasm.linter_set_lint_config_from_object(this.__wbg_ptr, object);
		if (ret[1]) throw takeFromExternrefTable0(ret[0]);
	}
	/**
	* @param {bigint | null} [start_time]
	* @param {bigint | null} [end_time]
	* @returns {any}
	*/
	summarize_stats(start_time, end_time) {
		return wasm.linter_summarize_stats(this.__wbg_ptr, !isLikeNone(start_time), isLikeNone(start_time) ? BigInt(0) : start_time, !isLikeNone(end_time), isLikeNone(end_time) ? BigInt(0) : end_time);
	}
};
if (Symbol.dispose) Linter.prototype[Symbol.dispose] = Linter.prototype.free;
/**
* Used exclusively for [\`Linter::organized_lints\`]
*/
var OrganizedGroup = class OrganizedGroup {
	static __wrap(ptr) {
		const obj = Object.create(OrganizedGroup.prototype);
		obj.__wbg_ptr = ptr;
		OrganizedGroupFinalization.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		OrganizedGroupFinalization.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm.__wbg_organizedgroup_free(ptr, 0);
	}
	/**
	* @returns {string}
	*/
	get group() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.__wbg_get_organizedgroup_group(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* @returns {Lint[]}
	*/
	get lints() {
		const ret = wasm.__wbg_get_organizedgroup_lints(this.__wbg_ptr);
		var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
		wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
		return v1;
	}
	/**
	* @param {string} arg0
	*/
	set group(arg0) {
		const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		wasm.__wbg_set_organizedgroup_group(this.__wbg_ptr, ptr0, len0);
	}
	/**
	* @param {Lint[]} arg0
	*/
	set lints(arg0) {
		const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
		const len0 = WASM_VECTOR_LEN;
		wasm.__wbg_set_organizedgroup_lints(this.__wbg_ptr, ptr0, len0);
	}
};
if (Symbol.dispose) OrganizedGroup.prototype[Symbol.dispose] = OrganizedGroup.prototype.free;
/**
* A struct that represents two character indices in a string: a start and an end.
*/
var Span = class Span {
	static __wrap(ptr) {
		const obj = Object.create(Span.prototype);
		obj.__wbg_ptr = ptr;
		SpanFinalization.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		SpanFinalization.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm.__wbg_span_free(ptr, 0);
	}
	/**
	* @returns {number}
	*/
	get end() {
		return wasm.__wbg_get_span_end(this.__wbg_ptr) >>> 0;
	}
	/**
	* @returns {number}
	*/
	get start() {
		return wasm.__wbg_get_span_start(this.__wbg_ptr) >>> 0;
	}
	/**
	* @param {number} arg0
	*/
	set end(arg0) {
		wasm.__wbg_set_span_end(this.__wbg_ptr, arg0);
	}
	/**
	* @param {number} arg0
	*/
	set start(arg0) {
		wasm.__wbg_set_span_start(this.__wbg_ptr, arg0);
	}
	/**
	* @param {string} json
	* @returns {Span}
	*/
	static from_json(json) {
		const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.span_from_json(ptr0, len0);
		if (ret[2]) throw takeFromExternrefTable0(ret[1]);
		return Span.__wrap(ret[0]);
	}
	/**
	* @returns {boolean}
	*/
	is_empty() {
		return wasm.span_is_empty(this.__wbg_ptr) !== 0;
	}
	/**
	* @returns {number}
	*/
	len() {
		return wasm.span_len(this.__wbg_ptr) >>> 0;
	}
	/**
	* @param {number} start
	* @param {number} end
	* @returns {Span}
	*/
	static new(start, end) {
		const ret = wasm.span_new(start, end);
		return Span.__wrap(ret);
	}
	/**
	* @returns {string}
	*/
	to_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.span_to_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
};
if (Symbol.dispose) Span.prototype[Symbol.dispose] = Span.prototype.free;
/**
* A suggestion to fix a Lint.
*/
var Suggestion = class Suggestion {
	static __wrap(ptr) {
		const obj = Object.create(Suggestion.prototype);
		obj.__wbg_ptr = ptr;
		SuggestionFinalization.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		SuggestionFinalization.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm.__wbg_suggestion_free(ptr, 0);
	}
	/**
	* @param {string} json
	* @returns {Suggestion}
	*/
	static from_json(json) {
		const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.suggestion_from_json(ptr0, len0);
		if (ret[2]) throw takeFromExternrefTable0(ret[1]);
		return Suggestion.__wrap(ret[0]);
	}
	/**
	* Get the text that is going to replace the problematic section.
	* If [\`Self::kind\`] is \`SuggestionKind::Remove\`, this will return an empty
	* string.
	* @returns {string}
	*/
	get_replacement_text() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.suggestion_get_replacement_text(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
	/**
	* @returns {SuggestionKind}
	*/
	kind() {
		return wasm.suggestion_kind(this.__wbg_ptr);
	}
	/**
	* @returns {string}
	*/
	to_json() {
		let deferred1_0;
		let deferred1_1;
		try {
			const ret = wasm.suggestion_to_json(this.__wbg_ptr);
			deferred1_0 = ret[0];
			deferred1_1 = ret[1];
			return getStringFromWasm0(ret[0], ret[1]);
		} finally {
			wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
		}
	}
};
if (Symbol.dispose) Suggestion.prototype[Symbol.dispose] = Suggestion.prototype.free;
/**
* Tags the variant of suggestion.
* @enum {0 | 1 | 2}
*/
const SuggestionKind = Object.freeze({
	/**
	* Replace the problematic text.
	*/
	Replace: 0,
	"0": "Replace",
	/**
	* Remove the problematic text.
	*/
	Remove: 1,
	"1": "Remove",
	/**
	* Insert additional text after the error.
	*/
	InsertAfter: 2,
	"2": "InsertAfter"
});
/**
* @returns {any}
*/
function get_default_lint_config() {
	return wasm.get_default_lint_config();
}
/**
* @returns {string}
*/
function get_default_lint_config_as_json() {
	let deferred1_0;
	let deferred1_1;
	try {
		const ret = wasm.get_default_lint_config_as_json();
		deferred1_0 = ret[0];
		deferred1_1 = ret[1];
		return getStringFromWasm0(ret[0], ret[1]);
	} finally {
		wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
	}
}
/**
* Set up the WebAssembly module's logging.
*/
function setup() {
	wasm.setup();
}
/**
* @param {string} text
* @returns {string}
*/
function to_title_case(text) {
	let deferred2_0;
	let deferred2_1;
	try {
		const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.to_title_case(ptr0, len0);
		deferred2_0 = ret[0];
		deferred2_1 = ret[1];
		return getStringFromWasm0(ret[0], ret[1]);
	} finally {
		wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
	}
}
function __wbg_get_imports() {
	return {
		__proto__: null,
		"./harper_wasm_bg.js": {
			__proto__: null,
			__wbg_Error_30c8987f7c2ed4e2: function(arg0, arg1) {
				return Error(getStringFromWasm0(arg0, arg1));
			},
			__wbg_String_8564e559799eccda: function(arg0, arg1) {
				const ptr1 = passStringToWasm0(String(arg1), wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
				const len1 = WASM_VECTOR_LEN;
				getDataViewMemory0().setInt32(arg0 + 4, len1, true);
				getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
			},
			__wbg___wbindgen_boolean_get_5b446f51afd21013: function(arg0) {
				const v = arg0;
				const ret = typeof v === "boolean" ? v : void 0;
				return isLikeNone(ret) ? 16777215 : ret ? 1 : 0;
			},
			__wbg___wbindgen_debug_string_4687d8d8c2017d52: function(arg0, arg1) {
				const ptr1 = passStringToWasm0(debugString(arg1), wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
				const len1 = WASM_VECTOR_LEN;
				getDataViewMemory0().setInt32(arg0 + 4, len1, true);
				getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
			},
			__wbg___wbindgen_is_function_1f9d30630b8b1d3d: function(arg0) {
				return typeof arg0 === "function";
			},
			__wbg___wbindgen_is_object_3c45d4f2dde4e749: function(arg0) {
				const val = arg0;
				return typeof val === "object" && val !== null;
			},
			__wbg___wbindgen_is_string_90b56bc79aad6f6c: function(arg0) {
				return typeof arg0 === "string";
			},
			__wbg___wbindgen_jsval_loose_eq_677f21e468d6b461: function(arg0, arg1) {
				return arg0 == arg1;
			},
			__wbg___wbindgen_number_get_2e0e7dee9f701a71: function(arg0, arg1) {
				const obj = arg1;
				const ret = typeof obj === "number" ? obj : void 0;
				getDataViewMemory0().setFloat64(arg0 + 8, isLikeNone(ret) ? 0 : ret, true);
				getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), true);
			},
			__wbg___wbindgen_string_get_0380ccaa2f57f0d9: function(arg0, arg1) {
				const obj = arg1;
				const ret = typeof obj === "string" ? obj : void 0;
				var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
				var len1 = WASM_VECTOR_LEN;
				getDataViewMemory0().setInt32(arg0 + 4, len1, true);
				getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
			},
			__wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
				throw new Error(getStringFromWasm0(arg0, arg1));
			},
			__wbg_call_6137034ef55c9d0f: function() {
				return handleError(function(arg0, arg1) {
					return arg0.call(arg1);
				}, arguments);
			},
			__wbg_done_b41a1d26cdb37fb6: function(arg0) {
				return arg0.done;
			},
			__wbg_entries_fb6397112b1de25f: function(arg0) {
				return Object.entries(arg0);
			},
			__wbg_error_757e9472f8410341: function(arg0, arg1) {
				let deferred0_0;
				let deferred0_1;
				try {
					deferred0_0 = arg0;
					deferred0_1 = arg1;
					console.error(getStringFromWasm0(arg0, arg1));
				} finally {
					wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
				}
			},
			__wbg_getRandomValues_973dabfb0ad1769f: function() {
				return handleError(function(arg0, arg1) {
					globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
				}, arguments);
			},
			__wbg_getRandomValues_a608c4436c19407a: function() {
				return handleError(function(arg0, arg1) {
					globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
				}, arguments);
			},
			__wbg_getTime_f5a55efff2585d5d: function(arg0) {
				return arg0.getTime();
			},
			__wbg_get_658f6698067d9515: function() {
				return handleError(function(arg0, arg1) {
					return Reflect.get(arg0, arg1);
				}, arguments);
			},
			__wbg_get_6c896e0571ddae51: function(arg0, arg1) {
				return arg0[arg1 >>> 0];
			},
			__wbg_get_unchecked_288889d017702237: function(arg0, arg1) {
				return arg0[arg1 >>> 0];
			},
			__wbg_instanceof_ArrayBuffer_a99f175873e5d9b8: function(arg0) {
				let result;
				try {
					result = arg0 instanceof ArrayBuffer;
				} catch (_) {
					result = false;
				}
				return result;
			},
			__wbg_instanceof_Uint8Array_828cef2aaacafc31: function(arg0) {
				let result;
				try {
					result = arg0 instanceof Uint8Array;
				} catch (_) {
					result = false;
				}
				return result;
			},
			__wbg_iterator_e3c31c892080e444: function() {
				return Symbol.iterator;
			},
			__wbg_length_7f3c00c40364105e: function(arg0) {
				return arg0.length;
			},
			__wbg_length_d4bdea10311bd9cf: function(arg0) {
				return arg0.length;
			},
			__wbg_lint_new: function(arg0) {
				return Lint.__wrap(arg0);
			},
			__wbg_lint_unwrap: function(arg0) {
				return Lint.__unwrap(arg0);
			},
			__wbg_log_1f8cbb01c83d06c2: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
				let deferred0_0;
				let deferred0_1;
				try {
					deferred0_0 = arg0;
					deferred0_1 = arg1;
					console.log(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7));
				} finally {
					wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
				}
			},
			__wbg_log_a54ca6b45e09078a: function(arg0, arg1) {
				let deferred0_0;
				let deferred0_1;
				try {
					deferred0_0 = arg0;
					deferred0_1 = arg1;
					console.log(getStringFromWasm0(arg0, arg1));
				} finally {
					wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
				}
			},
			__wbg_mark_6b7f03786f5e4d61: function(arg0, arg1) {
				performance.mark(getStringFromWasm0(arg0, arg1));
			},
			__wbg_measure_0e21b33a1c6e3a29: function() {
				return handleError(function(arg0, arg1, arg2, arg3) {
					let deferred0_0;
					let deferred0_1;
					let deferred1_0;
					let deferred1_1;
					try {
						deferred0_0 = arg0;
						deferred0_1 = arg1;
						deferred1_0 = arg2;
						deferred1_1 = arg3;
						performance.measure(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
					} finally {
						wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
						wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
					}
				}, arguments);
			},
			__wbg_new_0_72d020f0c63443d4: function() {
				return /* @__PURE__ */ new Date();
			},
			__wbg_new_1dbf7428bba60a42: function(arg0) {
				return new Uint8Array(arg0);
			},
			__wbg_new_227d7c05414eb861: function() {
				return /* @__PURE__ */ new Error();
			},
			__wbg_new_28744009d011f847: function() {
				return /* @__PURE__ */ new Map();
			},
			__wbg_new_617a8cdb8bb1130e: function() {
				return /* @__PURE__ */ new Object();
			},
			__wbg_new_ee2291f50781bf1d: function() {
				return new Array();
			},
			__wbg_next_33784799010f1bbe: function(arg0) {
				return arg0.next;
			},
			__wbg_next_f4aac29c42af995c: function() {
				return handleError(function(arg0) {
					return arg0.next();
				}, arguments);
			},
			__wbg_organizedgroup_new: function(arg0) {
				return OrganizedGroup.__wrap(arg0);
			},
			__wbg_prototypesetcall_bc27214492979395: function(arg0, arg1, arg2) {
				Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
			},
			__wbg_set_6ae97e73113c4f0b: function(arg0, arg1, arg2) {
				return arg0.set(arg1, arg2);
			},
			__wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
				arg0[arg1] = arg2;
			},
			__wbg_set_bea140a88be9b277: function(arg0, arg1, arg2) {
				arg0[arg1 >>> 0] = arg2;
			},
			__wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
				const ret = arg1.stack;
				const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
				const len1 = WASM_VECTOR_LEN;
				getDataViewMemory0().setInt32(arg0 + 4, len1, true);
				getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
			},
			__wbg_suggestion_new: function(arg0) {
				return Suggestion.__wrap(arg0);
			},
			__wbg_value_f3c585ee8f5ba40c: function(arg0) {
				return arg0.value;
			},
			__wbindgen_generic_0000000000000001: function(arg0) {
				return arg0;
			},
			__wbindgen_generic_0000000000000002: function(arg0, arg1) {
				return getStringFromWasm0(arg0, arg1);
			},
			__wbindgen_init_externref_table: function() {
				const table = wasm.__wbindgen_externrefs;
				const offset = table.grow(4);
				table.set(0, void 0);
				table.set(offset + 0, void 0);
				table.set(offset + 1, null);
				table.set(offset + 2, true);
				table.set(offset + 3, false);
			}
		}
	};
}
const LintFinalization = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm.__wbg_lint_free(ptr, 1));
const LinterFinalization = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm.__wbg_linter_free(ptr, 1));
const OrganizedGroupFinalization = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm.__wbg_organizedgroup_free(ptr, 1));
const SpanFinalization = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm.__wbg_span_free(ptr, 1));
const SuggestionFinalization = typeof FinalizationRegistry === "undefined" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((ptr) => wasm.__wbg_suggestion_free(ptr, 1));
function addToExternrefTable0(obj) {
	const idx = wasm.__externref_table_alloc();
	wasm.__wbindgen_externrefs.set(idx, obj);
	return idx;
}
function _assertClass(instance, klass) {
	if (!(instance instanceof klass)) throw new Error(\`expected instance of \${klass.name}\`);
}
function debugString(val) {
	const type = typeof val;
	if (type == "number" || type == "boolean" || val == null) return \`\${val}\`;
	if (type == "string") return \`"\${val}"\`;
	if (type == "symbol") {
		const description = val.description;
		if (description == null) return "Symbol";
		else return \`Symbol(\${description})\`;
	}
	if (type == "function") {
		const name = val.name;
		if (typeof name == "string" && name.length > 0) return \`Function(\${name})\`;
		else return "Function";
	}
	if (Array.isArray(val)) {
		const length = val.length;
		let debug = "[";
		if (length > 0) debug += debugString(val[0]);
		for (let i = 1; i < length; i++) debug += ", " + debugString(val[i]);
		debug += "]";
		return debug;
	}
	const builtInMatches = /\\[object ([^\\]]+)\\]/.exec(toString.call(val));
	let className;
	if (builtInMatches && builtInMatches.length > 1) className = builtInMatches[1];
	else return toString.call(val);
	if (className == "Object") try {
		return "Object(" + JSON.stringify(val) + ")";
	} catch (_) {
		return "Object";
	}
	if (val instanceof Error) return \`\${val.name}: \${val.message}\\n\${val.stack}\`;
	return className;
}
function getArrayJsValueFromWasm0(ptr, len) {
	ptr = ptr >>> 0;
	const mem = getDataViewMemory0();
	const result = [];
	for (let i = ptr; i < ptr + 4 * len; i += 4) result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
	wasm.__externref_drop_slice(ptr, len);
	return result;
}
function getArrayU8FromWasm0(ptr, len) {
	ptr = ptr >>> 0;
	return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
let cachedBigUint64ArrayMemory0 = null;
function getBigUint64ArrayMemory0() {
	if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.byteLength === 0) cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
	return cachedBigUint64ArrayMemory0;
}
let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
	if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
	return cachedDataViewMemory0;
}
function getStringFromWasm0(ptr, len) {
	return decodeText(ptr >>> 0, len);
}
let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
	if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
	return cachedUint8ArrayMemory0;
}
function handleError(f, args) {
	try {
		return f.apply(this, args);
	} catch (e) {
		const idx = addToExternrefTable0(e);
		wasm.__wbindgen_exn_store(idx);
	}
}
function isLikeNone(x) {
	return x === void 0 || x === null;
}
function passArray64ToWasm0(arg, malloc) {
	const ptr = malloc(arg.length * 8, 8) >>> 0;
	getBigUint64ArrayMemory0().set(arg, ptr / 8);
	WASM_VECTOR_LEN = arg.length;
	return ptr;
}
function passArray8ToWasm0(arg, malloc) {
	const ptr = malloc(arg.length * 1, 1) >>> 0;
	getUint8ArrayMemory0().set(arg, ptr / 1);
	WASM_VECTOR_LEN = arg.length;
	return ptr;
}
function passArrayJsValueToWasm0(array, malloc) {
	const ptr = malloc(array.length * 4, 4) >>> 0;
	for (let i = 0; i < array.length; i++) {
		const add = addToExternrefTable0(array[i]);
		getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
	}
	WASM_VECTOR_LEN = array.length;
	return ptr;
}
function passStringToWasm0(arg, malloc, realloc) {
	if (realloc === void 0) {
		const buf = cachedTextEncoder.encode(arg);
		const ptr = malloc(buf.length, 1) >>> 0;
		getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
		WASM_VECTOR_LEN = buf.length;
		return ptr;
	}
	let len = arg.length;
	let ptr = malloc(len, 1) >>> 0;
	const mem = getUint8ArrayMemory0();
	let offset = 0;
	for (; offset < len; offset++) {
		const code = arg.charCodeAt(offset);
		if (code > 127) break;
		mem[ptr + offset] = code;
	}
	if (offset !== len) {
		if (offset !== 0) arg = arg.slice(offset);
		ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
		const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
		const ret = cachedTextEncoder.encodeInto(arg, view);
		offset += ret.written;
		ptr = realloc(ptr, len, offset, 1) >>> 0;
	}
	WASM_VECTOR_LEN = offset;
	return ptr;
}
function takeFromExternrefTable0(idx) {
	const value = wasm.__wbindgen_externrefs.get(idx);
	wasm.__externref_table_dealloc(idx);
	return value;
}
let cachedTextDecoder = new TextDecoder("utf-8", {
	ignoreBOM: true,
	fatal: true
});
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
	numBytesDecoded += len;
	if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
		cachedTextDecoder = new TextDecoder("utf-8", {
			ignoreBOM: true,
			fatal: true
		});
		cachedTextDecoder.decode();
		numBytesDecoded = len;
	}
	return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
const cachedTextEncoder = new TextEncoder();
if (!("encodeInto" in cachedTextEncoder)) cachedTextEncoder.encodeInto = function(arg, view) {
	const buf = cachedTextEncoder.encode(arg);
	view.set(buf);
	return {
		read: arg.length,
		written: buf.length
	};
};
let WASM_VECTOR_LEN = 0;
let wasm;
function __wbg_finalize_init(instance, module) {
	wasm = instance.exports;
	cachedBigUint64ArrayMemory0 = null;
	cachedDataViewMemory0 = null;
	cachedUint8ArrayMemory0 = null;
	wasm.__wbindgen_start();
	return wasm;
}
async function __wbg_load(module, imports) {
	if (typeof Response === "function" && module instanceof Response) {
		if (!module.ok) throw new Error(\`failed to fetch Wasm: \${module.status} \${module.statusText} fetching '\${module.url}'\`);
		if (typeof WebAssembly.instantiateStreaming === "function") try {
			return await WebAssembly.instantiateStreaming(module, imports);
		} catch (e) {
			if (expectedResponseType(module.type) && module.headers.get("Content-Type") !== "application/wasm") console.warn("\`WebAssembly.instantiateStreaming\` failed because your server does not serve Wasm with \`application/wasm\` MIME type. Falling back to \`WebAssembly.instantiate\` which is slower. Original error:\\n", e);
			else throw e;
		}
		const bytes = await module.arrayBuffer();
		return await WebAssembly.instantiate(bytes, imports);
	} else {
		const instance = await WebAssembly.instantiate(module, imports);
		if (instance instanceof WebAssembly.Instance) return {
			instance,
			module
		};
		else return instance;
	}
	function expectedResponseType(type) {
		switch (type) {
			case "basic":
			case "cors":
			case "default": return true;
		}
		return false;
	}
}
function initSync(module) {
	if (wasm !== void 0) return wasm;
	if (module !== void 0) {
		if (Object.getPrototypeOf(module) === Object.prototype) ({module} = module);
		else console.warn("using deprecated parameters for \`initSync()\`; pass a single object instead");
	}
	const imports = __wbg_get_imports();
	if (!(module instanceof WebAssembly.Module)) module = new WebAssembly.Module(module);
	return __wbg_finalize_init(new WebAssembly.Instance(module, imports), module);
}
async function __wbg_init(module_or_path) {
	if (wasm !== void 0) return wasm;
	if (module_or_path !== void 0) {
		if (Object.getPrototypeOf(module_or_path) === Object.prototype) ({module_or_path} = module_or_path);
		else console.warn("using deprecated parameters for the initialization function; pass a single object instead");
	}
	if (module_or_path === void 0) module_or_path = new URL();
	const imports = __wbg_get_imports();
	if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) module_or_path = fetch(module_or_path);
	const { instance, module } = await __wbg_load(await module_or_path, imports);
	return __wbg_finalize_init(instance, module);
}
// ../../node_modules/.pnpm/p-lazy@5.0.0/node_modules/p-lazy/index.js
var PLazy = class PLazy extends Promise {
	#executor;
	#promise;
	constructor(executor) {
		super((resolve) => {
			resolve();
		});
		this.#executor = executor;
	}
	static from(function_) {
		return new PLazy((resolve) => {
			resolve(function_());
		});
	}
	static resolve(value) {
		return new PLazy((resolve) => {
			resolve(value);
		});
	}
	static reject(error) {
		return new PLazy((resolve, reject) => {
			reject(error);
		});
	}
	then(onFulfilled, onRejected) {
		this.#promise ??= new Promise(this.#executor);
		return this.#promise.then(onFulfilled, onRejected);
	}
	catch(onRejected) {
		this.#promise ??= new Promise(this.#executor);
		return this.#promise.catch(onRejected);
	}
	finally(onFinally) {
		this.#promise ??= new Promise(this.#executor);
		return this.#promise.finally(onFinally);
	}
};
// ../../node_modules/.pnpm/mimic-fn@4.0.0/node_modules/mimic-fn/index.js
const copyProperty = (to, from, property, ignoreNonConfigurable) => {
	if (property === "length" || property === "prototype") return;
	if (property === "arguments" || property === "caller") return;
	const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
	const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);
	if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) return;
	Object.defineProperty(to, property, fromDescriptor);
};
const canCopyProperty = function(toDescriptor, fromDescriptor) {
	return toDescriptor === void 0 || toDescriptor.configurable || toDescriptor.writable === fromDescriptor.writable && toDescriptor.enumerable === fromDescriptor.enumerable && toDescriptor.configurable === fromDescriptor.configurable && (toDescriptor.writable || toDescriptor.value === fromDescriptor.value);
};
const changePrototype = (to, from) => {
	const fromPrototype = Object.getPrototypeOf(from);
	if (fromPrototype === Object.getPrototypeOf(to)) return;
	Object.setPrototypeOf(to, fromPrototype);
};
const wrappedToString = (withName, fromBody) => \`/* Wrapped \${withName}*/\\n\${fromBody}\`;
const toStringDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, "toString");
const toStringName = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name");
const changeToString = (to, from, name) => {
	const withName = name === "" ? "" : \`with \${name.trim()}() \`;
	const newToString = wrappedToString.bind(null, withName, from.toString());
	Object.defineProperty(newToString, "name", toStringName);
	Object.defineProperty(to, "toString", {
		...toStringDescriptor,
		value: newToString
	});
};
function mimicFunction(to, from, { ignoreNonConfigurable = false } = {}) {
	const { name } = to;
	for (const property of Reflect.ownKeys(from)) copyProperty(to, from, property, ignoreNonConfigurable);
	changePrototype(to, from);
	changeToString(to, from, name);
	return to;
}
// ../../node_modules/.pnpm/p-memoize@7.1.1/node_modules/p-memoize/dist/index.js
const cacheStore = /* @__PURE__ */ new WeakMap();
/**
[Memoize](https://en.wikipedia.org/wiki/Memoization) functions - An optimization used to speed up consecutive function calls by caching the result of calls with identical input.

@param fn - Function to be memoized.

@example
\`\`\`
import {setTimeout as delay} from 'node:timer/promises';
import pMemoize from 'p-memoize';
import got from 'got';

const memoizedGot = pMemoize(got);

await memoizedGot('https://sindresorhus.com');

// This call is cached
await memoizedGot('https://sindresorhus.com');

await delay(2000);

// This call is not cached as the cache has expired
await memoizedGot('https://sindresorhus.com');
\`\`\`
*/
function pMemoize(fn, { cacheKey = ([firstArgument]) => firstArgument, cache = /* @__PURE__ */ new Map() } = {}) {
	const promiseCache = /* @__PURE__ */ new Map();
	const memoized = function(...arguments_) {
		const key = cacheKey(arguments_);
		if (promiseCache.has(key)) return promiseCache.get(key);
		const promise = (async () => {
			try {
				if (cache && await cache.has(key)) return await cache.get(key);
				const result = await fn.apply(this, arguments_);
				try {
					return result;
				} finally {
					if (cache) await cache.set(key, result);
				}
			} finally {
				promiseCache.delete(key);
			}
		})();
		promiseCache.set(key, promise);
		return promise;
	};
	mimicFunction(memoized, fn, { ignoreNonConfigurable: true });
	cacheStore.set(memoized, cache);
	return memoized;
}
// src/BinaryModule.ts
function inferGlueFlavor(binary) {
	return binary.includes("harper_wasm_slim") ? "slim" : "full";
}
function loadGlue(glueFlavor) {
	if (glueFlavor === "slim") return harper_wasm_slim_exports;
	return harper_wasm_exports;
}
function getDefaultGlueBinary(binary, glueFlavor) {
	if (glueFlavor === "slim") return binary;
	if (binary.includes("harper_wasm_bg.wasm")) return binary.replace("harper_wasm_bg.wasm", "harper_wasm_slim_bg.wasm");
	return null;
}
function getInitInput(binary) {
	if (typeof process !== "undefined" && binary.startsWith("file://")) return import(
		/* webpackIgnore: true */
		/* @vite-ignore */
		"fs"
).then((fs) => new Promise((resolve, reject) => {
		fs.readFile(new URL(binary).pathname, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	}));
	return binary;
}
async function loadBinaryUncached(binary, glueFlavor) {
	const exports = loadGlue(glueFlavor);
	const defaultGlueBinary = getDefaultGlueBinary(binary, glueFlavor);
	if (defaultGlueBinary != null) try {
		await __wbg_init$1({ module_or_path: getInitInput(defaultGlueBinary) });
	} catch (err) {
		if (glueFlavor === "slim") throw err;
	}
	await exports.default({ module_or_path: getInitInput(binary) });
	return exports;
}
const loadBinaryByFlavor = {
	full: pMemoize((binary) => loadBinaryUncached(binary, "full")),
	slim: pMemoize((binary) => loadBinaryUncached(binary, "slim"))
};
function loadBinary(binary, glueFlavor) {
	return loadBinaryByFlavor[glueFlavor](binary);
}
/** A wrapper around the underlying WebAssembly module that contains Harper's core code. Used to construct a \`Linter\`, as well as access some miscellaneous other functions. */
var BinaryModuleImpl = class {
	url = "";
	glueFlavor = "full";
	inner = null;
	/** Load a binary from a specified URL. This is the only recommended way to construct this type. */
	static create(url, glueFlavor) {
		const module = new SuperBinaryModule();
		module.url = url;
		module.glueFlavor = glueFlavor ?? inferGlueFlavor(typeof url === "string" ? url : url.href);
		module.inner = PLazy.from(() => loadBinary(typeof module.url === "string" ? module.url : module.url.href, module.glueFlavor));
		return module;
	}
	async getDefaultLintConfigAsJSON() {
		return (await this.inner).get_default_lint_config_as_json();
	}
	async getDefaultLintConfig() {
		return (await this.inner).get_default_lint_config();
	}
	async toTitleCase(text) {
		return (await this.inner).to_title_case(text);
	}
	async setup() {
		(await this.inner).setup();
	}
};
var SuperBinaryModule = class extends BinaryModuleImpl {
	async createLinter(dialect) {
		return (await this.getBinaryModule()).Linter.new(dialect ?? Dialect$1.American);
	}
	async getBinaryModule() {
		return await PLazy.from(() => loadBinary(typeof this.url === "string" ? this.url : this.url.href, this.glueFlavor));
	}
};
// src/LocalLinter.ts
function toWasmLanguage(language) {
	switch (language) {
		case "plaintext": return Language$1.Plain;
		case "typst": return Language$1.Typst;
		case "markdown":
		case void 0: return Language$1.Markdown;
		default:
			console.warn(\`Unknown Harper language '\${String(language)}'; using markdown.\`);
			return Language$1.Markdown;
	}
}
function toWasmLintArgs(text, options) {
	return [
		text,
		toWasmLanguage(options?.language),
		options?.forceAllHeadings ?? false,
		options?.regex_mask,
		options?.dedup ?? true,
		options?.isolateEnglish ?? false
	];
}
/** A Linter that runs in the current JavaScript context (meaning it is allowed to block the event loop).
* See the interface definition for more details. */
var LocalLinter = class {
	binary;
	inner;
	disposed = false;
	constructor(init) {
		this.binary = init.binary;
		this.binary.setup();
		this.inner = this.createInner(init.dialect);
	}
	createInner(dialect) {
		return PLazy.from(async () => {
			await this.binary.setup();
			return this.binary.createLinter(dialect);
		});
	}
	async setup() {
		await this.lint("", { language: "plaintext" });
		const exported = await this.exportIgnoredLints();
		await this.importIgnoredLints(exported);
	}
	async lint(text, options) {
		return (await this.inner).lint(...toWasmLintArgs(text, options));
	}
	async organizedLints(text, options) {
		const lintGroups = (await this.inner).organized_lints(...toWasmLintArgs(text, options));
		const output = {};
		for (const group of lintGroups) {
			output[group.group] = group.lints;
			group.free();
		}
		return output;
	}
	async applySuggestion(text, lint, suggestion) {
		return (await this.inner).apply_suggestion(text, lint, suggestion);
	}
	async isLikelyEnglish(text) {
		return (await this.inner).is_likely_english(text);
	}
	async isolateEnglish(text) {
		return (await this.inner).isolate_english(text);
	}
	async getLintConfig() {
		return (await this.inner).get_lint_config_as_object();
	}
	async getDefaultLintConfigAsJSON() {
		return await this.binary.getDefaultLintConfigAsJSON();
	}
	async getDefaultLintConfig() {
		return await this.binary.getDefaultLintConfig();
	}
	async getStructuredLintConfig() {
		return (await this.inner).get_structured_lint_config_as_object();
	}
	async getStructuredLintConfigJSON() {
		return (await this.inner).get_structured_lint_config_as_json();
	}
	async setLintConfig(config) {
		(await this.inner).set_lint_config_from_object(config);
	}
	async getLintConfigAsJSON() {
		return (await this.inner).get_lint_config_as_json();
	}
	async setLintConfigWithJSON(config) {
		(await this.inner).set_lint_config_from_json(config);
	}
	async toTitleCase(text) {
		return await this.binary.toTitleCase(text);
	}
	async getLintDescriptions() {
		return (await this.inner).get_lint_descriptions_as_object();
	}
	async getLintDescriptionsAsJSON() {
		return (await this.inner).get_lint_descriptions_as_json();
	}
	async getLintDescriptionsHTML() {
		return (await this.inner).get_lint_descriptions_html_as_object();
	}
	async getLintDescriptionsHTMLAsJSON() {
		return (await this.inner).get_lint_descriptions_html_as_json();
	}
	async ignoreLint(source, lint) {
		return await this.ignoreLints(source, [lint]);
	}
	async ignoreLints(source, lints) {
		(await this.inner).ignore_lints(source, lints);
	}
	async ignoreLintHash(hash) {
		(await this.inner).ignore_hashes(new BigUint64Array([hash]));
	}
	async exportIgnoredLints() {
		return (await this.inner).export_ignored_lints();
	}
	async importIgnoredLints(json) {
		(await this.inner).import_ignored_lints(json);
	}
	async contextHash(source, lint) {
		return (await this.inner).context_hash(source, lint);
	}
	async clearIgnoredLints() {
		(await this.inner).clear_ignored_lints();
	}
	async clearWords() {
		return (await this.inner).clear_words();
	}
	async importWords(words) {
		return (await this.inner).import_words(words);
	}
	async exportWords() {
		return (await this.inner).export_words();
	}
	async getDialect() {
		return (await this.inner).get_dialect();
	}
	async setDialect(dialect) {
		const inner = await this.inner;
		if (inner.get_dialect() !== dialect) {
			inner.free();
			this.inner = this.createInner(dialect);
		}
		return Promise.resolve();
	}
	async summarizeStats(start, end) {
		return (await this.inner).summarize_stats(start, end);
	}
	async generateStatsFile() {
		return (await this.inner).generate_stats_file();
	}
	async importStatsFile(statsFile) {
		return (await this.inner).import_stats_file(statsFile);
	}
	/**
	* Load a Weirpack from a Blob.
	*
	* Returns \`undefined\` if tests pass and rules are imported, otherwise returns
	* the Weirpack test failures.
	*/
	async loadWeirpackFromBlob(blob) {
		const bytes = new Uint8Array(await blob.arrayBuffer());
		return this.loadWeirpackFromBytes(bytes);
	}
	/**
	* Load a Weirpack from a byte array.
	*
	* Returns \`undefined\` if tests pass and rules are imported, otherwise returns
	* the Weirpack test failures.
	*/
	async loadWeirpackFromBytes(bytes) {
		const inner = await this.inner;
		const data = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
		return inner.import_weirpack(data);
	}
	async dispose() {
		if (this.disposed) return;
		this.disposed = true;
		(await this.inner).free();
	}
};
// src/utils.ts
function assert(condition, message) {
	if (!condition) throw new Error(message ?? "Assertion failed");
}
// src/Serializer.ts
function isSerializedRequest(v) {
	return typeof v === "object" && v !== null && "procName" in v && "args" in v;
}
/** An internal class that helps the \`WorkerLinter\` shuffle data across a messaging channel. */
var Serializer = class {
	binary;
	constructor(binary) {
		this.binary = binary;
		this.binary.setup();
	}
	async serializeArg(arg) {
		const { Lint, Span, Suggestion } = await this.binary.getBinaryModule();
		if (Array.isArray(arg)) return {
			json: JSON.stringify(await Promise.all(arg.map((a) => this.serializeArg(a)))),
			type: "Array"
		};
		const argType = typeof arg;
		switch (argType) {
			case "string":
			case "number":
			case "boolean":
			case "undefined": return {
				json: JSON.stringify(arg),
				type: argType
			};
			case "bigint": return {
				json: arg.toString(),
				type: argType
			};
		}
		if (arg.to_json !== void 0) {
			const json = arg.to_json();
			let type;
			const constructorName = arg.constructor?.name;
			if (arg instanceof Lint || constructorName === "Lint") type = "Lint";
			else if (arg instanceof Suggestion || constructorName === "Suggestion") type = "Suggestion";
			else if (arg instanceof Span || constructorName === "Span") type = "Span";
			if (type === void 0) throw new Error("Unhandled case: type undefined");
			return {
				json,
				type
			};
		}
		if (argType == "object") return {
			json: JSON.stringify(await Promise.all(Object.entries(arg).map(([key, value]) => this.serializeArg([key, value])))),
			type: "object"
		};
		throw new Error(\`Unhandled case: \${arg}\`);
	}
	async serialize(req) {
		return {
			procName: req.procName,
			args: await Promise.all(req.args.map((arg) => this.serializeArg(arg)))
		};
	}
	async deserializeArg(requestArg) {
		const { Lint, Span, Suggestion } = await this.binary.getBinaryModule();
		switch (requestArg.type) {
			case "bigint": return BigInt(requestArg.json);
			case "undefined": return;
			case "boolean":
			case "number":
			case "string": return JSON.parse(requestArg.json);
			case "Suggestion": return Suggestion.from_json(requestArg.json);
			case "Lint": return Lint.from_json(requestArg.json);
			case "Span": return Span.from_json(requestArg.json);
			case "Array": {
				const parsed = JSON.parse(requestArg.json);
				assert(Array.isArray(parsed));
				return await Promise.all(parsed.map((arg) => this.deserializeArg(arg)));
			}
			case "object": {
				const parsed = JSON.parse(requestArg.json);
				return Object.fromEntries(await Promise.all(parsed.map((val) => this.deserializeArg(val))));
			}
			default: throw new Error(\`Unhandled case: \${requestArg.type}\`);
		}
	}
	async deserialize(request) {
		return {
			procName: request.procName,
			args: await Promise.all(request.args.map((arg) => this.deserializeArg(arg)))
		};
	}
};
// src/WorkerLinter/worker.ts
self.postMessage("ready");
self.onmessage = (e) => {
	const [binaryUrl, dialect, glueFlavor] = e.data;
	if (typeof binaryUrl !== "string") throw new TypeError(\`Expected binary to be a string of url but got \${typeof binaryUrl}.\`);
	if (glueFlavor !== void 0 && glueFlavor !== "full" && glueFlavor !== "slim") throw new TypeError(\`Expected glue flavor to be "full" or "slim" but got \${glueFlavor}.\`);
	const binary = SuperBinaryModule.create(binaryUrl, glueFlavor);
	const serializer = new Serializer(binary);
	const linter = new LocalLinter({
		binary,
		dialect
	});
	async function processRequest(v) {
		const { procName, args } = await serializer.deserialize(v);
		if (procName in linter) {
			const res = await linter[procName](...args);
			postMessage(await serializer.serializeArg(res));
		}
	}
	self.onmessage = (e) => {
		if (isSerializedRequest(e.data)) processRequest(e.data);
	};
};
`,f=typeof self<`u`&&self.Blob&&new Blob([`URL.revokeObjectURL(import.meta.url);`,d],{type:`text/javascript;charset=utf-8`});function p(e){let t;try{if(t=f&&(self.URL||self.webkitURL).createObjectURL(f),!t)throw``;let n=new Worker(t,{type:`module`,name:e?.name});return n.addEventListener(`error`,()=>{(self.URL||self.webkitURL).revokeObjectURL(t)}),n}catch{return new Worker(`data:text/javascript;charset=utf-8,`+encodeURIComponent(d),{type:`module`,name:e?.name})}}var m=class{binary;serializer;dialect;worker;requestQueue;working=!0;disposed=!1;constructor(e){this.binary=e.binary,this.serializer=new u(this.binary),this.dialect=e.dialect,this.worker=new p,this.requestQueue=[],this.worker.onmessage=()=>{this.setupMainEventListeners(),this.worker.postMessage([this.binary.url,this.dialect,a(this.binary)]),this.working=!1,this.submitRemainingRequests()}}setupMainEventListeners(){this.worker.onmessage=e=>{let{resolve:t}=this.requestQueue.shift();this.serializer.deserializeArg(e.data).then(e=>{t(e),this.working=!1,this.submitRemainingRequests()})},this.worker.onmessageerror=e=>{let{reject:t}=this.requestQueue.shift();t(e.data),this.working=!1,this.submitRemainingRequests()}}setup(){return this.rpc(`setup`,[])}lint(e,t){return this.rpc(`lint`,[e,t])}organizedLints(e,t){return this.rpc(`organizedLints`,[e,t])}applySuggestion(e,t,n){return this.rpc(`applySuggestion`,[e,t,n])}isLikelyEnglish(e){return this.rpc(`isLikelyEnglish`,[e])}isolateEnglish(e){return this.rpc(`isolateEnglish`,[e])}async getLintConfig(){return JSON.parse(await this.getLintConfigAsJSON())}setLintConfig(e){return this.setLintConfigWithJSON(JSON.stringify(e))}getLintConfigAsJSON(){return this.rpc(`getLintConfigAsJSON`,[])}setLintConfigWithJSON(e){return this.rpc(`setLintConfigWithJSON`,[e])}toTitleCase(e){return this.rpc(`toTitleCase`,[e])}getLintDescriptionsAsJSON(){return this.rpc(`getLintDescriptionsAsJSON`,[])}async getLintDescriptions(){return JSON.parse(await this.getLintDescriptionsAsJSON())}getLintDescriptionsHTMLAsJSON(){return this.rpc(`getLintDescriptionsHTMLAsJSON`,[])}async getLintDescriptionsHTML(){return JSON.parse(await this.getLintDescriptionsHTMLAsJSON())}getDefaultLintConfigAsJSON(){return this.rpc(`getDefaultLintConfigAsJSON`,[])}async getDefaultLintConfig(){return JSON.parse(await this.getDefaultLintConfigAsJSON())}async getStructuredLintConfig(){return JSON.parse(await this.getStructuredLintConfigJSON())}getStructuredLintConfigJSON(){return this.rpc(`getStructuredLintConfigJSON`,[])}async dispose(){this.disposed||(await this.rpc(`dispose`,[]),this.disposed=!0,this.requestQueue=[],this.worker.terminate())}ignoreLint(e,t){return this.ignoreLints(e,[t])}ignoreLints(e,t){return this.rpc(`ignoreLints`,[e,t])}ignoreLintHash(e){return this.rpc(`ignoreLintHash`,[e])}exportIgnoredLints(){return this.rpc(`exportIgnoredLints`,[])}importIgnoredLints(e){return this.rpc(`importIgnoredLints`,[e])}contextHash(e,t){return this.rpc(`contextHash`,[e,t])}clearIgnoredLints(){return this.rpc(`clearIgnoredLints`,[])}clearWords(){return this.rpc(`clearWords`,[])}importWords(e){return this.rpc(`importWords`,[e])}exportWords(){return this.rpc(`exportWords`,[])}getDialect(){return this.rpc(`getDialect`,[])}setDialect(e){return this.rpc(`setDialect`,[e])}summarizeStats(e,t){return this.rpc(`summarizeStats`,[e,t])}generateStatsFile(){return this.rpc(`generateStatsFile`,[])}importStatsFile(e){return this.rpc(`importStatsFile`,[e])}async loadWeirpackFromBlob(e){let t=new Uint8Array(await e.arrayBuffer()),n=Array.from(t);return await this.rpc(`loadWeirpackFromBytes`,[n])}async loadWeirpackFromBytes(e){let t=Array.from(e);return await this.rpc(`loadWeirpackFromBytes`,[t])}async rpc(e,t){if(this.disposed)throw Error(`WorkerLinter has been disposed.`);return new Promise((n,r)=>{this.requestQueue.push({resolve:n,reject:r,request:{procName:e,args:t}}),this.submitRemainingRequests()})}async submitRemainingRequests(){if(!this.working){if(this.working=!0,this.requestQueue.length>0){let{request:e}=this.requestQueue[0],t=await this.serializer.serialize(e);this.worker.postMessage(t)}else this.working=!1}}},h=Uint8Array,g=Uint16Array,_=Int32Array,v=new h([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),ee=new h([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),y=new h([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),b=function(e,t){for(var n=new g(31),r=0;r<31;++r)n[r]=t+=1<<e[r-1];for(var i=new _(n[30]),r=1;r<30;++r)for(var a=n[r];a<n[r+1];++a)i[a]=a-n[r]<<5|r;return{b:n,r:i}},x=b(v,2),te=x.b,S=x.r;te[28]=258,S[258]=28;for(var C=b(ee,0),ne=C.b,w=C.r,T=new g(32768),E=0;E<32768;++E){var D=(E&43690)>>1|(E&21845)<<1;D=(D&52428)>>2|(D&13107)<<2,D=(D&61680)>>4|(D&3855)<<4,T[E]=((D&65280)>>8|(D&255)<<8)>>1}for(var O=(function(e,t,n){for(var r=e.length,i=0,a=new g(t);i<r;++i)e[i]&&++a[e[i]-1];var o=new g(t);for(i=1;i<t;++i)o[i]=o[i-1]+a[i-1]<<1;var s;if(n){s=new g(1<<t);var c=15-t;for(i=0;i<r;++i)if(e[i])for(var l=i<<4|e[i],u=t-e[i],d=o[e[i]-1]++<<u,f=d|(1<<u)-1;d<=f;++d)s[T[d]>>c]=l}else for(s=new g(r),i=0;i<r;++i)e[i]&&(s[i]=T[o[e[i]-1]++]>>15-e[i]);return s}),k=new h(288),E=0;E<144;++E)k[E]=8;for(var E=144;E<256;++E)k[E]=9;for(var E=256;E<280;++E)k[E]=7;for(var E=280;E<288;++E)k[E]=8;for(var A=new h(32),E=0;E<32;++E)A[E]=5;var j=O(k,9,0),M=O(k,9,1),re=O(A,5,0),N=O(A,5,1),P=function(e){for(var t=e[0],n=1;n<e.length;++n)e[n]>t&&(t=e[n]);return t},F=function(e,t,n){var r=t/8|0;return(e[r]|e[r+1]<<8)>>(t&7)&n},I=function(e,t){var n=t/8|0;return(e[n]|e[n+1]<<8|e[n+2]<<16)>>(t&7)},L=function(e){return(e+7)/8|0},R=function(e,t,n){return(t==null||t<0)&&(t=0),(n==null||n>e.length)&&(n=e.length),new h(e.subarray(t,n))},z=[`unexpected EOF`,`invalid block type`,`invalid length/literal`,`invalid distance`,`stream finished`,`no stream handler`,,`no callback`,`invalid UTF-8 data`,`extra field too long`,`date not in range 1980-2099`,`filename too long`,`stream finishing`,`invalid zip data`],B=function(e,t,n){var r=Error(t||z[e]);if(r.code=e,Error.captureStackTrace&&Error.captureStackTrace(r,B),!n)throw r;return r},ie=function(e,t,n,r){var i=e.length,a=r?r.length:0;if(!i||t.f&&!t.l)return n||new h(0);var o=!n,s=o||t.i!=2,c=t.i;o&&(n=new h(i*3));var l=function(e){var t=n.length;if(e>t){var r=new h(Math.max(t*2,e));r.set(n),n=r}},u=t.f||0,d=t.p||0,f=t.b||0,p=t.l,m=t.d,g=t.m,_=t.n,b=i*8;do{if(!p){u=F(e,d,1);var x=F(e,d+1,3);if(d+=3,!x){var S=L(d)+4,C=e[S-4]|e[S-3]<<8,w=S+C;if(w>i){c&&B(0);break}s&&l(f+C),n.set(e.subarray(S,w),f),t.b=f+=C,t.p=d=w*8,t.f=u;continue}if(x==1)p=M,m=N,g=9,_=5;else if(x==2){var T=F(e,d,31)+257,E=F(e,d+10,15)+4,D=T+F(e,d+5,31)+1;d+=14;for(var k=new h(D),A=new h(19),j=0;j<E;++j)A[y[j]]=F(e,d+j*3,7);d+=E*3;for(var re=P(A),z=(1<<re)-1,ie=O(A,re,1),j=0;j<D;){var V=ie[F(e,d,z)];d+=V&15;var S=V>>4;if(S<16)k[j++]=S;else{var H=0,U=0;for(S==16?(U=3+F(e,d,3),d+=2,H=k[j-1]):S==17?(U=3+F(e,d,7),d+=3):S==18&&(U=11+F(e,d,127),d+=7);U--;)k[j++]=H}}var W=k.subarray(0,T),G=k.subarray(T);g=P(W),_=P(G),p=O(W,g,1),m=O(G,_,1)}else B(1);if(d>b){c&&B(0);break}}s&&l(f+131072);for(var ae=(1<<g)-1,oe=(1<<_)-1,K=d;;K=d){var H=p[I(e,d)&ae],q=H>>4;if(d+=H&15,d>b){c&&B(0);break}if(H||B(2),q<256)n[f++]=q;else if(q==256){K=d,p=null;break}else{var J=q-254;if(q>264){var j=q-257,Y=v[j];J=F(e,d,(1<<Y)-1)+te[j],d+=Y}var X=m[I(e,d)&oe],se=X>>4;X||B(3),d+=X&15;var G=ne[se];if(se>3){var Y=ee[se];G+=I(e,d)&(1<<Y)-1,d+=Y}if(d>b){c&&B(0);break}s&&l(f+131072);var ce=f+J;if(f<G){var le=a-G,Z=Math.min(G,ce);for(le+f<0&&B(3);f<Z;++f)n[f]=r[le+f]}for(;f<ce;++f)n[f]=n[f-G]}}t.l=p,t.p=K,t.b=f,t.f=u,p&&(u=1,t.m=g,t.d=m,t.n=_)}while(!u);return f!=n.length&&o?R(n,0,f):n.subarray(0,f)},V=function(e,t,n){n<<=t&7;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8},H=function(e,t,n){n<<=t&7;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8,e[r+2]|=n>>16},U=function(e,t){for(var n=[],r=0;r<e.length;++r)e[r]&&n.push({s:r,f:e[r]});var i=n.length,a=n.slice();if(!i)return{t:J,l:0};if(i==1){var o=new h(n[0].s+1);return o[n[0].s]=1,{t:o,l:1}}n.sort(function(e,t){return e.f-t.f}),n.push({s:-1,f:25001});var s=n[0],c=n[1],l=0,u=1,d=2;for(n[0]={s:-1,f:s.f+c.f,l:s,r:c};u!=i-1;)s=n[n[l].f<n[d].f?l++:d++],c=n[l!=u&&n[l].f<n[d].f?l++:d++],n[u++]={s:-1,f:s.f+c.f,l:s,r:c};for(var f=a[0].s,r=1;r<i;++r)a[r].s>f&&(f=a[r].s);var p=new g(f+1),m=W(n[u-1],p,0);if(m>t){var r=0,_=0,v=m-t,ee=1<<v;for(a.sort(function(e,t){return p[t.s]-p[e.s]||e.f-t.f});r<i;++r){var y=a[r].s;if(p[y]>t)_+=ee-(1<<m-p[y]),p[y]=t;else break}for(_>>=v;_>0;){var b=a[r].s;p[b]<t?_-=1<<t-p[b]++-1:++r}for(;r>=0&&_;--r){var x=a[r].s;p[x]==t&&(--p[x],++_)}m=t}return{t:new h(p),l:m}},W=function(e,t,n){return e.s==-1?Math.max(W(e.l,t,n+1),W(e.r,t,n+1)):t[e.s]=n},G=function(e){for(var t=e.length;t&&!e[--t];);for(var n=new g(++t),r=0,i=e[0],a=1,o=function(e){n[r++]=e},s=1;s<=t;++s)if(e[s]==i&&s!=t)++a;else{if(!i&&a>2){for(;a>138;a-=138)o(32754);a>2&&(o(a>10?a-11<<5|28690:a-3<<5|12305),a=0)}else if(a>3){for(o(i),--a;a>6;a-=6)o(8304);a>2&&(o(a-3<<5|8208),a=0)}for(;a--;)o(i);a=1,i=e[s]}return{c:n.subarray(0,r),n:t}},ae=function(e,t){for(var n=0,r=0;r<t.length;++r)n+=e[r]*t[r];return n},oe=function(e,t,n){var r=n.length,i=L(t+2);e[i]=r&255,e[i+1]=r>>8,e[i+2]=e[i]^255,e[i+3]=e[i+1]^255;for(var a=0;a<r;++a)e[i+a+4]=n[a];return(i+4+r)*8},K=function(e,t,n,r,i,a,o,s,c,l,u){V(t,u++,n),++i[256];for(var d=U(i,15),f=d.t,p=d.l,m=U(a,15),h=m.t,_=m.l,b=G(f),x=b.c,te=b.n,S=G(h),C=S.c,ne=S.n,w=new g(19),T=0;T<x.length;++T)++w[x[T]&31];for(var T=0;T<C.length;++T)++w[C[T]&31];for(var E=U(w,7),D=E.t,M=E.l,N=19;N>4&&!D[y[N-1]];--N);var P=l+5<<3,F=ae(i,k)+ae(a,A)+o,I=ae(i,f)+ae(a,h)+o+14+3*N+ae(w,D)+2*w[16]+3*w[17]+7*w[18];if(c>=0&&P<=F&&P<=I)return oe(t,u,e.subarray(c,c+l));var L,R,z,B;if(V(t,u,1+(I<F)),u+=2,I<F){L=O(f,p,0),R=f,z=O(h,_,0),B=h;var ie=O(D,M,0);V(t,u,te-257),V(t,u+5,ne-1),V(t,u+10,N-4),u+=14;for(var T=0;T<N;++T)V(t,u+3*T,D[y[T]]);u+=3*N;for(var W=[x,C],K=0;K<2;++K)for(var q=W[K],T=0;T<q.length;++T){var J=q[T]&31;V(t,u,ie[J]),u+=D[J],J>15&&(V(t,u,q[T]>>5&127),u+=q[T]>>12)}}else L=j,R=k,z=re,B=A;for(var T=0;T<s;++T){var Y=r[T];if(Y>255){var J=Y>>18&31;H(t,u,L[J+257]),u+=R[J+257],J>7&&(V(t,u,Y>>23&31),u+=v[J]);var X=Y&31;H(t,u,z[X]),u+=B[X],X>3&&(H(t,u,Y>>5&8191),u+=ee[X])}else H(t,u,L[Y]),u+=R[Y]}return H(t,u,L[256]),u+R[256]},q=new _([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),J=new h(0),Y=function(e,t,n,r,i,a){var o=a.z||e.length,s=new h(r+o+5*(1+Math.ceil(o/7e3))+i),c=s.subarray(r,s.length-i),l=a.l,u=(a.r||0)&7;if(t){u&&(c[0]=a.r>>3);for(var d=q[t-1],f=d>>13,p=d&8191,m=(1<<n)-1,y=a.p||new g(32768),b=a.h||new g(m+1),x=Math.ceil(n/3),te=2*x,C=function(t){return(e[t]^e[t+1]<<x^e[t+2]<<te)&m},ne=new _(25e3),T=new g(288),E=new g(32),D=0,O=0,k=a.i||0,A=0,j=a.w||0,M=0;k+2<o;++k){var re=C(k),N=k&32767,P=b[re];if(y[N]=P,b[re]=N,j<=k){var F=o-k;if((D>7e3||A>24576)&&(F>423||!l)){u=K(e,c,0,ne,T,E,O,A,M,k-M,u),A=D=O=0,M=k;for(var I=0;I<286;++I)T[I]=0;for(var I=0;I<30;++I)E[I]=0}var z=2,B=0,ie=p,V=N-P&32767;if(F>2&&re==C(k-V))for(var H=Math.min(f,F)-1,U=Math.min(32767,k),W=Math.min(258,F);V<=U&&--ie&&N!=P;){if(e[k+z]==e[k+z-V]){for(var G=0;G<W&&e[k+G]==e[k+G-V];++G);if(G>z){if(z=G,B=V,G>H)break;for(var ae=Math.min(V,G-2),J=0,I=0;I<ae;++I){var Y=k-V+I&32767,X=Y-y[Y]&32767;X>J&&(J=X,P=Y)}}}N=P,P=y[N],V+=N-P&32767}if(B){ne[A++]=268435456|S[z]<<18|w[B];var se=S[z]&31,ce=w[B]&31;O+=v[se]+ee[ce],++T[257+se],++E[ce],j=k+z,++D}else ne[A++]=e[k],++T[e[k]]}}for(k=Math.max(k,j);k<o;++k)ne[A++]=e[k],++T[e[k]];u=K(e,c,l,ne,T,E,O,A,M,k-M,u),l||(a.r=u&7|c[u/8|0]<<3,u-=7,a.h=b,a.p=y,a.i=k,a.w=j)}else{for(var k=a.w||0;k<o+l;k+=65535){var le=k+65535;le>=o&&(c[u/8|0]=l,le=o),u=oe(c,u+1,e.subarray(k,le))}a.i=o}return R(s,0,r+L(u)+i)},X=(function(){for(var e=new Int32Array(256),t=0;t<256;++t){for(var n=t,r=9;--r;)n=(n&1&&-306674912)^n>>>1;e[t]=n}return e})(),se=function(){var e=-1;return{p:function(t){for(var n=e,r=0;r<t.length;++r)n=X[n&255^t[r]]^n>>>8;e=n},d:function(){return~e}}},ce=function(e,t,n,r,i){if(!i&&(i={l:1},t.dictionary)){var a=t.dictionary.subarray(-32768),o=new h(a.length+e.length);o.set(a),o.set(e,a.length),e=o,i.w=a.length}return Y(e,t.level==null?6:t.level,t.mem==null?i.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+t.mem,n,r,i)},le=function(e,t){var n={};for(var r in e)n[r]=e[r];for(var r in t)n[r]=t[r];return n},Z=function(e,t){return e[t]|e[t+1]<<8},Q=function(e,t){return(e[t]|e[t+1]<<8|e[t+2]<<16|e[t+3]<<24)>>>0},ue=function(e,t){return Q(e,t)+Q(e,t+4)*4294967296},$=function(e,t,n){for(;n;++t)e[t]=n,n>>>=8};function de(e,t){return ce(e,t||{},0,0)}function fe(e,t){return ie(e,{i:2},t&&t.out,t&&t.dictionary)}var pe=function(e,t,n,r){for(var i in e){var a=e[i],o=t+i,s=r;Array.isArray(a)&&(s=le(r,a[1]),a=a[0]),ArrayBuffer.isView(a)?n[o]=[a,s]:(n[o+=`/`]=[new h(0),s],pe(a,o,n,r))}},me=typeof TextEncoder<`u`&&new TextEncoder,he=typeof TextDecoder<`u`&&new TextDecoder;try{he.decode(J,{stream:!0})}catch{}var ge=function(e){for(var t=``,n=0;;){var r=e[n++],i=(r>127)+(r>223)+(r>239);if(n+i>e.length)return{s:t,r:R(e,n-1)};i?i==3?(r=((r&15)<<18|(e[n++]&63)<<12|(e[n++]&63)<<6|e[n++]&63)-65536,t+=String.fromCharCode(55296|r>>10,56320|r&1023)):i&1?t+=String.fromCharCode((r&31)<<6|e[n++]&63):t+=String.fromCharCode((r&15)<<12|(e[n++]&63)<<6|e[n++]&63):t+=String.fromCharCode(r)}};function _e(e,t){if(t){for(var n=new h(e.length),r=0;r<e.length;++r)n[r]=e.charCodeAt(r);return n}if(me)return me.encode(e);for(var i=e.length,a=new h(e.length+(e.length>>1)),o=0,s=function(e){a[o++]=e},r=0;r<i;++r){if(o+5>a.length){var c=new h(o+8+(i-r<<1));c.set(a),a=c}var l=e.charCodeAt(r);l<128||t?s(l):l<2048?(s(192|l>>6),s(128|l&63)):l>55295&&l<57344?(l=65536+(l&1047552)|e.charCodeAt(++r)&1023,s(240|l>>18),s(128|l>>12&63),s(128|l>>6&63),s(128|l&63)):(s(224|l>>12),s(128|l>>6&63),s(128|l&63))}return R(a,0,o)}function ve(e,t){if(t){for(var n=``,r=0;r<e.length;r+=16384)n+=String.fromCharCode.apply(null,e.subarray(r,r+16384));return n}if(he)return he.decode(e);var i=ge(e),a=i.s,n=i.r;return n.length&&B(8),a}var ye=function(e,t){return t+30+Z(e,t+26)+Z(e,t+28)},be=function(e,t,n){var r=Z(e,t+28),i=Z(e,t+30),a=ve(e.subarray(t+46,t+46+r),!(Z(e,t+8)&2048)),o=t+46+r,s=xe(e,o,i,n,Q(e,t+20),Q(e,t+24),Q(e,t+42)),c=s[0],l=s[1],u=s[2];return[Z(e,t+10),c,l,a,o+i+Z(e,t+32),u]},xe=function(e,t,n,r,i,a,o){var s=i==4294967295,c=a==4294967295,l=o==4294967295,u=t+n,d=s+c+l;if(r&&d){for(;t+4<u;t+=4+Z(e,t+2))if(Z(e,t)==1)return[s?ue(e,t+4+8*c):i,c?ue(e,t+4):a,l?ue(e,t+4+8*(c+s)):o,1];r<2&&B(13)}return[i,a,o,0]},Se=function(e){var t=0;if(e)for(var n in e){var r=e[n].length;r>65535&&B(9),t+=r+4}return t},Ce=function(e,t,n,r,i,a,o,s){var c=r.length,l=n.extra,u=s&&s.length,d=Se(l);$(e,t,o==null?67324752:33639248),t+=4,o!=null&&(e[t++]=20,e[t++]=n.os),e[t]=20,t+=2,e[t++]=n.flag<<1|(a<0&&8),e[t++]=i&&8,e[t++]=n.compression&255,e[t++]=n.compression>>8;var f=new Date(n.mtime==null?Date.now():n.mtime),p=f.getFullYear()-1980;if((p<0||p>119)&&B(10),$(e,t,p<<25|f.getMonth()+1<<21|f.getDate()<<16|f.getHours()<<11|f.getMinutes()<<5|f.getSeconds()>>1),t+=4,a!=-1&&($(e,t,n.crc),$(e,t+4,a<0?-a-2:a),$(e,t+8,n.size)),$(e,t+12,c),$(e,t+14,d),t+=16,o!=null&&($(e,t,u),$(e,t+6,n.attrs),$(e,t+10,o),t+=14),e.set(r,t),t+=c,d)for(var m in l){var h=l[m],g=h.length;$(e,t,+m),$(e,t+2,g),e.set(h,t+4),t+=4+g}return u&&(e.set(s,t),t+=u),t},we=function(e,t,n,r,i){$(e,t,101010256),$(e,t+8,n),$(e,t+10,n),$(e,t+12,r),$(e,t+16,i)};function Te(e,t){t||={};var n={},r=[];pe(e,``,n,t);var i=0,a=0;for(var o in n){var s=n[o],c=s[0],l=s[1],u=l.level==0?0:8,d=_e(o),f=d.length,p=l.comment,m=p&&_e(p),g=m&&m.length,_=Se(l.extra);f>65535&&B(11);var v=u?de(c,l):c,ee=v.length,y=se();y.p(c),r.push(le(l,{size:c.length,crc:y.d(),c:v,f:d,m,u:f!=o.length||m&&p.length!=g,o:i,compression:u})),i+=30+f+_+ee,a+=76+2*(f+_)+(g||0)+ee}for(var b=new h(a+22),x=i,te=a-i,S=0;S<r.length;++S){var d=r[S];Ce(b,d.o,d,d.f,d.u,d.c.length);var C=30+d.f.length+Se(d.extra);b.set(d.c,d.o+C),Ce(b,i,d,d.f,d.u,d.c.length,d.o,d.m),i+=16+C+(d.m?d.m.length:0)}return we(b,i,r.length,te,x),b}function Ee(e,t){for(var n={},r=e.length-22;Q(e,r)!=101010256;--r)(!r||e.length-r>65558)&&B(13);var i=Z(e,r+8);if(!i)return{};var a=Q(e,r+16),o=Q(e,r-20)==117853008;if(o){var s=Q(e,r-12);o=Q(e,s)==101075792,o&&(i=Q(e,s+32),a=Q(e,s+48))}for(var c=t&&t.filter,l=0;l<i;++l){var u=be(e,a,o),d=u[0],f=u[1],p=u[2],m=u[3],g=u[4],_=u[5],v=ye(e,_);a=g,(!c||c({name:m,size:f,originalSize:p,compression:d}))&&(d?d==8?n[m]=fe(e.subarray(v,v+f),{out:new h(p)}):B(14,`unknown compression type `+d):n[m]=R(e,v,v+f))}return n}var De=`manifest.json`;function Oe(e){if(!e.has(De))throw Error(`Weirpack is missing manifest.json`);let t={};for(let[n,r]of e.entries())t[n]=_e(r);return Te(t,{level:6})}function ke(e){let t=Ee(e),n=t[De];if(!n)throw Error(`Weirpack is missing manifest.json`);let r=ve(n),i=JSON.parse(r),a=new Map;a.set(De,r);let o=Object.keys(t);o.sort();for(let e of o){let n=t[e];n&&e!==De&&a.set(e,ve(n))}return{manifest:i,files:a}}export{n as Dialect,c as LocalLinter,e as SuggestionKind,m as WorkerLinter,r as createBinaryModuleFromUrl,Oe as packWeirpackFiles,ke as unpackWeirpackBytes};