## Example
The following code describes a simple calculator. It contains less than 25 lines of code!

Properties:
- Solves simple equations using `+`,`-`,`*`,`/` and power `^` operations.
- Correctly resolves minus / negative, e.g. `1--2` gives 3, `1+-2` gives -1.
- Applies proper order of operation, e.g. `x+y*z^w=x+(y*(z^w))`.
- Handles parenthesis, e.g. `x*(y+z)` will add first then multiply.
- Handles left-to-right association for `+`,`-`,`*`,`/` operations, e.g. `z+y+z=(x+y)+z`
- Handles right-to-left association for `^` (power) operation, e.g. `x^y^z = x^(y^z)`
- Allows arbitrary number of spaces between operators and numbers

This code provides an example of how to construct your own parser.