## Example
The code here defines a simple calculator. It is very small but complete. It provides a rich example of how you can use Sparser to build your own custom language.

Properties:

- Solves simple equations using `+`,`-`,`*`,`/` and power `^` operations.
- Correctly resolves minus / negative, e.g. `1--2` gives 3, `1+-2` gives -1.
- Applies proper order of operation, e.g. `x+y*z^w=x+(y*(z^w))`.
- Handles parenthesis, e.g. `x*(y+z)` will add first then multiply.
- Handles left-to-right association for `+`,`-`,`*`,`/` operations, e.g. `z+y+z=(x+y)+z`
- Handles right-to-left association for `^` (power) operation, e.g. `x^y^z = x^(y^z)`
- Allows arbitrary number of spaces between operators and numbers

To try it out, just serve it from a local web browser.  Have fun!