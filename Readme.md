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
The Rule function lets you define rules using tagged template literals. For instance, the following `number` rule will read string, translate it to a float, then push it on to a stack.

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

| Construct | Meaning |
| --------- | ------- |
| <> | Character set |
| [] | Optional |
| {} | One or more |
| () | Parenthesis |
| .. | Range (or steps) |
| : | Occurrences |
| ! | Not |
| \| | Or |
| & | And |
| "" | Text delimiting |
| '' | Text delimiting |

Here are examples. Assume that `A`,`B`,`C` are rules

| Example | Description | Note |
| ------- |------------ | ---- |
| <a..z> | matches a character from `a` to `z` inclusive | |
| <abc> | matches `a` or `b` or  `c` | |
| 'abc' | matches the string `abc` | [1] |
| '' | null match | [2] |
| A B | matches spaces/tabs between `A` and `B` | [3] |
| ..'b' | matches anything ending in `b` | [4] |
| {A} | matches 1 or more occurences of `A` | |
| [A] | matches 0 or 1 occurences of `A` | |
| [{A}] | matches 0 or more occurrences of `A` | |
| {[A]} | matches 0 or more occurrences of `A` | [5] |
| A:3 | matches 3 occurrences of `A` | |
| A:3..5 | matches 3 to 5 occurrences of `A` | |
| A:3.. | matches at least 3 occurrences of `A` | |
| A:..5 | matches up to 5 occurrences of `A` | |
| A:.. | matches 0 or more occurrences of `A` | |
| (A) | parenthesis enforce order of operation | |
| !A | matches non-existance of `A` | [6] |
| !!A | matches `A` but does not consume it | [7] |
| A\|B\|C | matches one of `A` or `B` or `C` | |
| A&B&C | matches `A` then `B` then `C` | [8] |
| ABC | matches `A` then `B` then `C` | [8] |
| ${A} | string template literal insertion of another rule | [9] |

Notes:

| Note | Details |
| ---- |:------- |
| [1] | Single quotes '' and double quotes "" are both accepted but cannot be intermixed. |
| [2] | Null matches always succeed but do not consume any characters. This makes them ideal for set up work within a rule. |
| [3] | An empty space outside of a string is used to indicate any amount of whitespace but does not include a new line. For now, this can be changed in the SParser code. In the future, this should be configurable. |
| [4] | This is used to capture sequences that are not known in advance. For instance `rule`'/*'..'*/'`` will capture 'C' style comments. The string passed to the action will include the terminator. Ideally the terminator could be a rule, but the performance penalty for this would be great and not justified. | 
| [5] | The construct `{[A]}` is technically an error (it will loop forever). Internally this is converted to the proper `[{A}]` |
| [6] | The `!A` will fail if A exists and will pass if A does not exist. Either way, no characters are consumed. |
| [7] | The `!!A` will pass if A exists, but because `!A` does not consume any characters, neither will `!!A`. This makes it a perfect way to check for something without actually consuming it. |
| [8] | The `&` are implied, so `A&B&C` is the same as `ABC` and more readable. |
| [9] | External rules are inserted by string template literal usage `${rule}`. For now only rules are accepted. Other types will cause errors. |






Refer to demos for more details.

### Why not use RegEx?
I thought about extending RegEx, but decided not to do it. Because we are doing something fundamentally different, many of the RegEx flags and constructs make no sense in this context. Other features are awkward or missing. Rather than hack RegEx (and confuse everybody) I decided to go with BNF-esque syntax. This is simpler and is better suited to what we are doing anyhow.

### Things to keep in mind:
- Each rule should try to consume at least one character.
- Handlers are called after all parsing has finished.