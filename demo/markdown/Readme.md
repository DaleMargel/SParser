# Markdown Compiler
### *Under Construction*

## What is Markdown?
Markdown allows you to convert simple text into html. It is very commonly used today. 

Unfortunately the markdown specifications are a bit loose. GitHub has done a great service in trying to standardize its own [GitHub Flavored Markdown](https://github.github.com/gfm/) **(GFM**) which is based on the excellent [CommonMark](https://spec.commonmark.org/) specifications.

## Why?
There are a few reasons I wrote this:

- I needed a test bed to verify **SParser** handling of relatively unstructured text. Markdown is ideal for this. Sparser was not designed to handle this particularly well and I needed to excercise (or exorcise) this so that I could improve it.

- **SParser** takes an unusual approach to parsing. Without comparisons to other techniques, I have no way to tell whether this is a good approach or not. There are a lot of **markdown** parsers available, so writing a markdown parser lets me compare SParser with other approaches using a real life problem.

## Progress
At this point, the code is almost complete with a few features missing:
- Sub lists
- Html
- Url
- character escapes

I wish to make this GFM compliant, so I need to implement the 500+ unit tests. I have already started on this but it will take time. I will implement the missing features in the process of adding the GFM tests.

## Observations
This markdown compiler is currently near it's final size so come size comparisons can be made. **Markd** is a very finely crafted markdown parser using a standard approach - and a good library to compare. At this point, this my parser is about **10%-20%** of the size of the Markd library (depending on compression). **This is a great sign**. Whether it can compete with speed remains to be seen.


