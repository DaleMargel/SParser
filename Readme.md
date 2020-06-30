# **SParser.js**
**A library that lets you to describe language handling using nothing but simple javascript**

## Why?
Writing a compiler is hard to do. There are a lot of tools to help you do this, but most require you learn obscure script syntax then compile it using a tool. The resulting code is opaque and difficult to understand or debug.

SParser takes a different tack. It starts by asking what is the minimum that a developer needs to write to describe a compiler.

- Rules are defined using template literals that can be nested inside of other rules.
- Rules are described using a sensible BNF-like syntax.
- An action can be attached to a rule to fire when the rule succeeds.
- Simplicity is favoured over speed, so the code is more easily understood. It is quite fast too!

Additional Sparser features:

- **Zero dependency:** it is single file with no external dependencies.
- **Small:** it is less than 8k unminified and unzipped, and under 2k minimized and zipped.
- **Hackable:** the code is simple enough understand, hack and debug as needed.
- **Powerful:** Sparser is written in (a lower level of) itself!

## Overview
Sparser.js exports 3 symbols.

### Rule
The Rule function lets you define rules using string template literals. For instance, the following rule will read a string of integers.

This rule, read a floating point number and push it onto a stack.

```javascript
	// read one or more digits
	const digits=rule`{<0..9>}`;

	// read digits with optiona fraction, parse as float and push it to a stack
	const number=rule`['-']${digits}[.${digits}]`.ons(s => stak.push(parseFloat(s)) );
```
The `ons()` method will provide the string that was parsed and let you run some code with it. If you do not need the string, then you can call `onx()` which does not pass anything. This saves your code the overhead of having to extract the string prior to calling your handlers.

### Defer
The `rules` function works fine until you need to use a rule before it has been defined, that is, a rule indirectly includes itself. This is a common feature of languages and one we must deal with. We use `defer` as a placeholder then set it later.

```javascript
	// contrived example to show how to use defer()
	const expr = defer();
	const brule = rule`B[${expr}]`;
	const arule = rule`A[${brule}]`;
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

| Construct | Meaning |
| --------- | ------- |
| `<>` | Character set |
| `[]` | Optional |
| `{}` | One or more |
| `()` | Parenthesis |
| `..` | Range (or steps) |
| `:` | Occurrences |
| `!` | Not |
| `|` | Or |
| `&` | And |
| `"` | Text delimiting |
| `'` | Text delimiting |

Quotes can be `"` or `'` and can be used to tag literal text, but this is not always necessary (see below).

Here are examples. Assume that A,B,C are rules

| Example | Description |
| ------- |----------- |
| `<a..z>` | matches a character from `a` to `z` inclusive |
| `<123>` | matches `1` or `2` or  `3` |
| `"bob"` | matches the string `bob` |
| `'bob'` | matches the string `bob` |
| `bob` | matches the string `bob`<br>cannot contain `[]{}()"'&|!` or `..` |
| `A B` | matches zero or more spaces between `A` and `B` |
| `A..B` | matches anything between `A` and `B`<br>handy for delimited comments, e.g., `/* comment */` |
| `..A` | steps and matches any characters until `A` |
| `{A}` | matches 1 or more occurences of `A` |
| `[A]` | matches 0 or 1 occurence of `A` |
| `[{A}]` | matches 0 or more occurrences of `A` |
| `{[A]}` | matches 0 or more occurrences of `A`; internally converted to `[{A}]` |
| `A:3..5` | matches 3 to 5 occurrences of `A` |
| `A:(3..5)` | matches 3 to 5 occurrences of `A`; easier to read |
| `A:3` | matches 3 occurrences of `A` |
| `A:3..` | matches at least 3 occurrences of `A` |
| `A:..5` | matches up to 5 occurrences of `A` |
| `(A)` | parenthesis sets order or operation |
| `!A` | matches non-existance of `A` and never consumes it |
| `!!A` | matches `A` but does not consume it |
| `A|B|C` | matches one of `A` or `B` or `C` |
| `A&B&C` | matches `A` then `B` then `C` |
| `ABC` | matches `A` then `B` then `C`; `&`'s implied when missing |
| `${A}` | string template literal substutution rule |

Refer to demos for more details.

### Why not use RegEx?
I thought about this, but decided not to do it. Because we are doing something fundamentally different here, many of the RegEx flags and constructs make no sense. Other features are awkward or missing. Rather than hack RegEx I decided to go with BNF, which is better suited to what we are doing anyhow.


### Things to keep in mind:
- Writing parsers is inherently difficult without practice.
- Each rule should try to consume at least one character.
- Debugging, speed and error handling are on my TODO: list.

Notes
- [GitHub list of parsers](https://github.com/xiaomuzhu/awesome-parser-js)
- [GitHub js parser](https://github.com/cherow/cherow)
- most parsers for markdown are over 2k sloc!
- https://github.com/meriyah/meriyah
- https://github.com/buntis/buntis
