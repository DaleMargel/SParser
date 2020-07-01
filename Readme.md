# **SParser.js**
**A library that lets you to describe language handling using nothing but simple javascript**

## Why?
Writing a compiler is hard to do. There are a lot of tools to help you do this, but most require you learn obscure scripts that are not always intuitive. The resulting code is big, opaque and difficult to understand or debug.

SParser takes a different tack. It starts by asking what is the minimum that a developer needs to write to describe a compiler.

- Rules are created using tagged template literals that can be nested inside of other rules.
- Rules are described using a sensible BNF-like syntax.
- An action can be attached to a rule to fire when the rule succeeds.

This allows the developer to write rules in a minimalistic fashion. The resulting code is light and quite fast.

Additional Sparser features:

- **Small:** it is a 7.2k zero-dependency library that minifies/zips to 1.6k.
- **Hackable:** the code is simple enough understand and change the parts that you don't like.
- **Powerful:** Sparser is written in (a lower level of) itself!

## Overview
Sparser.js exports 3 symbols.

### Rule
The Rule function lets you define rules using tagged template literals. For instance, the following rule will read string, translate it to a float, then push it on to a stack.

```javascript
	// read one or more digits
	const digits=rule`{<0..9>}`;

	// read and parse float then push it to a stack
	const number=rule`['-']${digits}['.'${digits}]`.ons(s => stak.push(parseFloat(s)) );
```
The `ons()` method will provide the string that was parsed and let you run some code with it. If you do not need the string, then you can call `on()` which does not pass anything. This saves your code the overhead of having to extract the string prior to calling your handlers.

### Defer
The `rules` function works fine until you need to use a rule before it has been defined - that is, a rule that indirectly includes itself. Here we use `defer` as a placeholder then set it later.

```javascript
	// contrived example to show how to use defer()
	const expr = defer();
	const brule = rule`'B'[${expr}]`;
	const arule = rule`'A'[${brule}]`;
	expr.set(arule); // ABABABA...
```

### Parse
Once you have built the parse tree, you can pass it to a parser function with the text you need to parse. The parser will return true on success. Currently there is only coarse error detection, but I expect to change this sometime.

```javascript
	// example of using parse with expr from above
	parse(expr,"ABAB"); // returns true
	parse(expr,"ABBA"); // returns false
```

## Syntax
The rule syntax is a modified BNF that has been tweaked to make it easier to use. Generally speaking:

NOTE: the '|' symbol confuses the GitHub markdown parser inside of a table, even when it is properly escaped. For now the '|' symbol will be replaced with a capital 'I', which looks the same in a sans-serif font. A '*' is added to remind the reader of this fact.

| Construct | Meaning |
| --------- | ------- |
| <> | Character set |
| [] | Optional |
| {} | One or more |
| () | Parenthesis |
| .. | Range (or steps) |
| : | Occurrences |
| ! | Not |
| I* (bar) | Or |
| & | And |
| "" | Text delimiting |
| '' | Text delimiting |

Here are examples. Assume that `A`,`B`,`C` are rules

| Example | Description |
| ------- |----------- |
| <a..z> | matches a character from `a` to `z` inclusive |
| <123> | matches `1` or `2` or  `3` |
| "bob" | matches the string `bob` |
| 'bob' | matches the string `bob` |
| A B | matches zero or more spaces/tabs between `A` and `B` |
| 'a'..'b' | matches anything between (strings) `a` and `b` |
| {A} | matches 1 or more occurences of `A` |
| [A] | matches 0 or 1 occurences of `A` |
| [{A}] | matches 0 or more occurrences of `A` |
| {[A]} | matches 0 or more occurrences of `A`; internally converted to `[{A}]` |
| A:3 | matches 3 occurrences of `A` |
| A:3..5 | matches 3 to 5 occurrences of `A` |
| A:3.. | matches at least 3 occurrences of `A` |
| A:..5 | matches up to 5 occurrences of `A` |
| (A) | parenthesis enforces order of operation |
| !A | matches non-existance of `A` and never consumes it |
| !!A | matches `A` but does not consume it |
| AIBIC* (bars) | matches one of `A` or `B` or `C` |
| A&B&C | matches `A` then `B` then `C` |
| ABC | matches `A` then `B` then `C`; `&`'s implied when missing |
| ${A} | string template literal insertion of another rule |

Refer to demos for more details.

### Why not use RegEx?
I thought about extending RegEx, but decided not to do it. Because we are doing something fundamentally different. Many of the RegEx flags and constructs make no sense in this context. Other features are awkward or missing. Rather than hack RegEx I decided to go with BNF, which is better suited to what we are doing anyhow.

### Things to keep in mind:
- Each rule should try to consume at least one character.
- Handlers are called after all parsing has finished.